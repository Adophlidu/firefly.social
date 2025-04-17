import { omit } from 'lodash-es';
import { type Address, type Hex, keccak256 } from 'viem';
import { getChainId, switchChain, writeContract } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import type { NetworkType, SocialSource } from '@/constants/enum.js';
import { isLessThan, toFixed } from '@/helpers/number.js';
import { resolveRedPacketPlatformType } from '@/helpers/resolveRedPacketPlatformType.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import type { HappyRedPacketV4 } from '@/mask/constants.js';
import { HappyRedPacketV4ABI } from '@/mask/constants.js';
import { EVMChainResolver, EVMWeb3 } from '@/mask/index.js';
import type { FungibleToken } from '@/mask_pkgs/web3-shared/base/index.js';
import { getCurrentClaimProfile } from '@/providers/ethereum/getCurrentClaimProfile.js';
import { createRedPacketContract } from '@/providers/ethereum/getRedPacketContract.js';
import { signClaimMessage } from '@/providers/ethereum/signClaimMessage.js';
import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import {
    ContractTransaction,
    decodeEvents,
    type EthereumChainId,
    EthereumSchemaType,
    type GasConfig,
    getRedPacketConstant,
    getTokenConstant,
    type TransactionReceipt,
} from '#masknet/web3-shared-evm';

export interface CreateRedPacketContext {
    networkType: NetworkType;
    creator: string;
    chainId: EthereumChainId;
    version: number;
    publicKey: string;
    shares: number;
    duration: number;
    isRandom: boolean;
    total: string;
    name: string;
    message: string;
    token?: FungibleToken<EthereumChainId, EthereumSchemaType.Native | EthereumSchemaType.ERC20>;
}

export interface ClaimRedPacketContext {
    contextChainId: EthereumChainId;
    account: string;
    source: SocialSource;
    payload: RedPacketJSONPayload;
}

export interface CreateRedPacketParams {
    publicKey: string;
    shares: number;
    isRandom: boolean;
    duration: number;
    seed: string;
    message: string;
    name: string;
    tokenType: number;
    tokenAddress: string;
    total: string;
    token?: FungibleToken<EthereumChainId, EthereumSchemaType.Native | EthereumSchemaType.ERC20>;
}

interface CreateResult {
    hash: string;
    receipt: TransactionReceipt;
    events?: {
        [eventName: string]: any;
    };
}

class Provider {
    async createRedPacketParams(context: CreateRedPacketContext) {
        const { creator, duration, isRandom, message, name, shares, total, token, chainId, version, publicKey } =
            context;

        const contract = createRedPacketContract(chainId, version);
        const NATIVE_TOKEN_ADDRESS = getTokenConstant(chainId, 'NATIVE_TOKEN_ADDRESS');
        const tokenAddress = token?.schema === EthereumSchemaType.Native ? NATIVE_TOKEN_ADDRESS : token?.address;

        if (!tokenAddress) {
            if (process.env.NODE_ENV === 'development' && !NATIVE_TOKEN_ADDRESS) {
                console.error(
                    'Not native token address for chain %s. Do you forget to configure it in token.json file?',
                    token?.chainId,
                );
            }
            return null;
        }

        const params: CreateRedPacketParams = {
            publicKey,
            shares,
            isRandom,
            duration,
            seed: keccak256(Math.random().toString() as Hex),
            message,
            name,
            tokenType: token?.schema === EthereumSchemaType.Native ? 0 : 1,
            tokenAddress,
            total,
            token,
        };

        if (isLessThan(params.total, params.shares)) {
            console.error('At least [number of lucky drops] tokens to your lucky drop.');
            return null;
        }

        if (params.shares <= 0) {
            console.error('At least 1 person should be able to claim the lucky drop.');
            return null;
        }

        const methodParams = omit(params, ['token']) as Omit<CreateRedPacketParams, 'token'>;
        let gasError: Error | null = null;
        const value = toFixed(params.token?.schema === EthereumSchemaType.Native ? total : 0);

        const gas = await (contract as HappyRedPacketV4).methods
            .create_red_packet(
                methodParams.publicKey,
                methodParams.shares,
                methodParams.isRandom,
                methodParams.duration,
                methodParams.seed,
                methodParams.message,
                methodParams.name,
                methodParams.tokenType,
                methodParams.tokenAddress,
                methodParams.total,
            )
            .estimateGas({ from: creator, value })
            .catch((error: Error) => {
                gasError = error;
            });

        return {
            gas: gas ? toFixed(gas) : undefined,
            params,
            methodParams,
            gasError,
        };
    }

    async createRedPacket(context: CreateRedPacketContext, gasOption?: GasConfig): Promise<CreateResult | null> {
        const params = await this.createRedPacketParams(context);
        if (!params) return null;

        const { creator, chainId, version, token } = context;

        const contract = createRedPacketContract(chainId, version);
        if (!contract) throw new Error('Failed to create contract.');

        // estimate gas and compose transaction
        const tx = await new ContractTransaction(contract).fillAll(
            contract.methods.create_red_packet(
                params.methodParams.publicKey,
                params.methodParams.shares,
                params.methodParams.isRandom,
                params.methodParams.duration,
                params.methodParams.seed,
                params.methodParams.message,
                params.methodParams.name,
                params.methodParams.tokenType,
                params.methodParams.tokenAddress,
                params.methodParams.total,
            ),
            {
                from: creator,
                value: toFixed(token?.schema === EthereumSchemaType.Native ? params.params.total : 0),
                gas: params.gas,
                chainId,
                ...gasOption,
            },
        );

        const hash = await EVMWeb3.sendTransaction(tx, {
            chainId,
            paymentToken: gasOption?.gasCurrency,
            gasOptionType: gasOption?.gasOptionType,
        });
        const receipt = await EVMWeb3.getTransactionReceipt(hash, { chainId });
        if (receipt) {
            const events = decodeEvents(contract.options.jsonInterface, receipt.logs);

            return {
                hash,
                receipt,
                events,
            };
        }
        return { hash, receipt };
    }

    async claimRedPacket(context: ClaimRedPacketContext) {
        const rpid = context.payload.rpid;
        if (!rpid) return;

        const { account, source, contextChainId, payload } = context;
        const payloadChainId = payload.token?.chainId;
        const chainIdByName = EVMChainResolver.chainId('network' in payload ? payload.network! : '');
        const chainId = payloadChainId || chainIdByName || contextChainId;

        const globalChainId = getChainId(config);
        if (globalChainId !== chainId) await switchChain(config, { chainId });

        const claimWithSponsorHash = await runInSafeAsync(async () => {
            const me = await getCurrentClaimProfile(source);
            const sponsorable = await FireflyRedPacketEndpoint.checkGasFreeStatus(chainId, account);
            if (!sponsorable || !me?.profileId) return;
            return FireflyRedPacketEndpoint.claimForGasFree(rpid, account, {
                needLensAndFarcasterHandle: true,
                platform: resolveRedPacketPlatformType(source),
                profileId: me.profileId,
                handle: me.handle,
                lensToken: me.lensToken,
                farcasterMessage: me.farcasterMessage as HexString,
                farcasterSigner: me.farcasterSigner as HexString,
                farcasterSignature: me.farcasterSignature as HexString,
            });
        });
        if (claimWithSponsorHash) return claimWithSponsorHash;

        const hash = await writeContract(config, {
            abi: HappyRedPacketV4ABI,
            functionName: 'claim',
            args: [payload.rpid, await signClaimMessage(context), account],
            address: getRedPacketConstant(chainId, 'HAPPY_RED_PACKET_ADDRESS_V4') as Address,
            account: account as Address,
        });

        await waitForEthereumTransaction(chainId, hash);
        return hash;
    }
}

export const RedPacketProvider = new Provider();
