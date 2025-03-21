import { toFixed } from '@/helpers/number.js';
import { getRedPacketConstant, getTokenConstant, SchemaType } from '@masknet/web3-shared-evm';
import { useQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { type Address } from 'viem';

import { NetworkType } from '@/constants/enum.js';
import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { ZERO } from '@/helpers/number.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { HappyRedPacketV4ABI } from '@/mask/constants.js';
import { type CreateRedPacketContext, RedPacketProvider } from '@/providers/ethereum/RedPacket.js';

export function useEvmDefaultGas(context: CreateRedPacketContext, enabled = true) {
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
            const tokenAddress = token.schema === SchemaType.Native ? NATIVE_TOKEN_ADDRESS : token.address;
            if (!tokenAddress) return ZERO;

            const params = await RedPacketProvider.createRedPacketParams(context);
            if (!params) return ZERO;

            const value = toFixed(params.params.token?.schema === SchemaType.Native ? total : 0);
            const client = createWagmiPublicClient(chainId);
            const result = await runInSafeAsync(async () => {
                return client.estimateContractGas({
                    address: getRedPacketConstant(chainId, 'HAPPY_RED_PACKET_ADDRESS_V4') as Address,
                    abi: HappyRedPacketV4ABI,
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
