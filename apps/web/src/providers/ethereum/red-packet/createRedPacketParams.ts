import { omit } from 'lodash-es';
import { type Address, type Hex, keccak256 } from 'viem';
import { estimateContractGas } from 'viem/actions';

import RED_PACKET_ABI from '@/abis/RedPacket.json' with { type: 'json' };
import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { isLessThan } from '@/helpers/number.js';
import { logger } from '@/libs/Logger.js';
import { getEvmNativeTokenAddress } from '@/providers/ethereum/getNativeTokenAddress.js';
import { getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import type { CreateRedPacketContext, CreateRedPacketParams } from '@/providers/ethereum/red-packet/types.js';
import { EthereumSchemaType } from '@/web3-shared/evm/types.js';

export async function createRedPacketParams(context: CreateRedPacketContext) {
    const { creator, duration, isRandom, message, name, shares, total, token, chainId, version, publicKey } = context;

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
        logger.error('At least [number of lucky drops] tokens to your lucky drop.');
        return null;
    }

    if (params.shares <= 0) {
        logger.error('At least 1 person should be able to claim the lucky drop.');
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
