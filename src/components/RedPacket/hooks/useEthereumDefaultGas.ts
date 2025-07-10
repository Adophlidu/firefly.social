import { useQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { type Address } from 'viem';

import { NetworkType } from '@/constants/enum.js';
import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { toFixed, ZERO } from '@/helpers/number.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { type CreateRedPacketContext, EthereumRedPacket } from '@/providers/ethereum/RedPacket.js';
import { EthereumSchemaType, getTokenConstant } from '#masknet/web3-shared-evm';
import { getRedPacketContractAbi, getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import { RED_PACKET_CONTRACT_VERSION } from '@/constants/rp.js';

export function useEthereumDefaultGas(context: CreateRedPacketContext, enabled = true) {
    const { account, chainId } = useChainContext({
        account: context.creator,
    });

    return useQuery({
        enabled,
        queryKey: ['red-packet', 'create-gas', chainId, account, JSON.stringify(context), enabled],
        queryFn: async () => {
            if (context.networkType === NetworkType.Solana) return ZERO;

            const { total, token } = context;
            if (!token) return ZERO;

            const NATIVE_TOKEN_ADDRESS = getTokenConstant(chainId, 'NATIVE_TOKEN_ADDRESS');
            const tokenAddress = token.schema === EthereumSchemaType.Native ? NATIVE_TOKEN_ADDRESS : token.address;
            if (!tokenAddress) return ZERO;

            const params = await EthereumRedPacket.createRedPacketParams(context);
            if (!params) return ZERO;

            const value = toFixed(params.params.token?.schema === EthereumSchemaType.Native ? total : 0);
            const client = createWagmiPublicClient(chainId);
            const result = await runInSafeAsync(async () => {
                return client.estimateContractGas({
                    abi: getRedPacketContractAbi(RED_PACKET_CONTRACT_VERSION),
                    address: getRedPacketContractAddress(chainId, RED_PACKET_CONTRACT_VERSION),
                    functionName: 'create_red_packet',
                    args: [
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
                    ],
                    value: BigInt(value),
                    account: account as Address,
                });
            });

            return result ? new BigNumber(result.toString()) : ZERO;
        },
    });
}
