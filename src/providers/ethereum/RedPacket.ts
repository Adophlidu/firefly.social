import { omit } from 'lodash-es';
import { type Address, type Hex, keccak256 } from 'viem';
import { estimateContractGas } from 'viem/actions';
import { getChainId, switchChain, writeContract } from 'wagmi/actions';

import RED_PACKET_ABI from '@/abis/RedPacket.json' with { type: 'json' };
import { wagmiConfig } from '@/configs/wagmiClient.js';
import type { NetworkType, SocialSource } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { isLessThan } from '@/helpers/number.js';
import { resolveRedPacketPlatformType } from '@/helpers/resolveRedPacketPlatformType.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { getCurrentClaimProfile } from '@/providers/ethereum/getCurrentClaimProfile.js';
import { getEvmNativeTokenAddress } from '@/providers/ethereum/getNativeTokenAddress.js';
import { getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import { signClaimMessage } from '@/providers/ethereum/signClaimMessage.js';
import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { EVMChainResolver } from '@/web3-providers/Web3/EVM/apis/ResolverAPI.js';
import type { FungibleToken } from '@/web3-shared/base/specs.js';
import { type EthereumChainId, EthereumSchemaType } from '@/web3-shared/evm/types.js';

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
    events?: {
        [eventName: string]: any;
    };
}

class Provider {
    async createRedPacketParams(context: CreateRedPacketContext) {
        const { creator, duration, isRandom, message, name, shares, total, token, chainId, version, publicKey } =
            context;

        const tokenAddress =
            token?.schema === EthereumSchemaType.Native ? getEvmNativeTokenAddress(chainId) : token?.address;
        if (!tokenAddress) throw new Error('Token address is required for creating a red packet.');

        const params: CreateRedPacketParams = {
            publicKey,
            shares,
            isRandom,
            duration,
            seed: keccak256(crypto.getRandomValues(new Uint8Array(32)).toString() as Hex),
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

        try {
            const gas = await estimateContractGas(createWagmiPublicClient(chainId), {
                account: creator as Address,
                address: getRedPacketContractAddress(chainId),
                abi: RED_PACKET_ABI,
                functionName: 'create_red_packet',
                args: [
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
                ],
                value: params.token?.schema === EthereumSchemaType.Native ? BigInt(total) : undefined,
            });
            return {
                gas: `${gas}`,
                params,
                methodParams,
            };
        } catch (error) {
            return {
                params,
                methodParams,
                gasError: error,
            };
        }
    }

    async createRedPacket(context: CreateRedPacketContext): Promise<CreateResult | null> {
        throw new NotImplementedError();
    }

    async claimRedPacket(context: ClaimRedPacketContext) {
        const rpid = context.payload.rpid;
        if (!rpid) return;

        const { account, source, contextChainId, payload } = context;
        const payloadChainId = payload.token?.chainId;
        const chainIdByName = EVMChainResolver.chainId('network' in payload ? payload.network! : '');
        const chainId = payloadChainId || chainIdByName || contextChainId;

        const globalChainId = getChainId(wagmiConfig);
        if (globalChainId !== chainId) await switchChain(wagmiConfig, { chainId });

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
                farcasterMessage: me.farcasterMessage as Hex,
                farcasterSigner: me.farcasterSigner as Hex,
                farcasterSignature: me.farcasterSignature as Hex,
            });
        });
        if (claimWithSponsorHash) return claimWithSponsorHash;

        const hash = await writeContract(wagmiConfig, {
            abi: RED_PACKET_ABI,
            functionName: 'claim',
            args: [payload.rpid, await signClaimMessage(context), account],
            address: getRedPacketContractAddress(chainId),
            account: account as Address,
        });

        await waitForEthereumTransaction(chainId, hash);
        return hash;
    }
}

export const EthereumRedPacket = new Provider();
