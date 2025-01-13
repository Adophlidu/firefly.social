import { toFixed } from '@masknet/web3-shared-base';
import { getRedPacketConstant, getTokenConstant, SchemaType } from '@masknet/web3-shared-evm';
import { BigNumber } from 'bignumber.js';
import { useAsync } from 'react-use';
import { type Address } from 'viem';

import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { ZERO } from '@/helpers/number.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { HappyRedPacketV4ABI } from '@/mask/constants.js';
import { type CreateRedPacketContext, RedPacketProvider } from '@/providers/ethereum/RedPacket.js';

export function useDefaultCreateGas(context: CreateRedPacketContext) {
    const { account, chainId } = useChainContext({
        account: context.creator,
    });

    return useAsync(async () => {
        const HAPPY_RED_PACKET_ADDRESS_V4 = getRedPacketConstant(chainId, 'HAPPY_RED_PACKET_ADDRESS_V4');
        if (!HAPPY_RED_PACKET_ADDRESS_V4) return ZERO;

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
                address: HAPPY_RED_PACKET_ADDRESS_V4 as Address,
                abi: HappyRedPacketV4ABI,
                functionName: 'create_red_packet',
                args: params.methodParams,
                value: BigInt(value),
                account: account as Address,
            });
        });

        return result ? new BigNumber(result.toString()) : ZERO;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        chainId,
        account,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        JSON.stringify(context),
    ]);
}
