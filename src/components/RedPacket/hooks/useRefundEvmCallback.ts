import { useAsyncFn } from 'react-use';
import type { Address } from 'viem';
import { getChainId, switchChain, writeContract } from 'wagmi/actions';

import { queryClient } from '@/configs/queryClient.js';
import { config } from '@/configs/wagmiClient.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';
import { HappyRedPacketV4ABI } from '@/mask/constants.js';
import { getRedPacketConstant } from '#masknet/web3-shared-evm';

export function useRefundEvmCallback(rpid?: string, overrides?: ChainContextOverrides) {
    const { chainId, account } = useChainContext(overrides);

    return useAsyncFn(async () => {
        if (!rpid) return;

        const globalChainId = getChainId(config);
        if (globalChainId !== chainId) await switchChain(config, { chainId });

        const hash = await writeContract(config, {
            abi: HappyRedPacketV4ABI,
            functionName: 'refund',
            address: getRedPacketConstant(chainId, 'HAPPY_RED_PACKET_ADDRESS_V4') as Address,
            args: [rpid],
            chainId,
        });

        await waitForEthereumTransaction(chainId, hash);

        queryClient.refetchQueries({
            queryKey: ['red-packet', 'claim', rpid],
        });

        queryClient.refetchQueries({
            queryKey: ['red-packet', 'check-availability', chainId, 4, rpid, account],
        });
    }, [rpid, chainId, account]);
}
