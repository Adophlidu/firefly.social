import { useAsyncFn } from 'react-use';
import { getChainId, switchChain, writeContract } from 'wagmi/actions';

import RED_PACKET_ABI from '@/abis/RedPacket.json' with { type: 'json' };
import { queryClient } from '@/configs/queryClient.js';
import { config } from '@/configs/wagmiClient.js';
import { RED_PACKET_CONTRACT_VERSION } from '@/constants/rp.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';
import { getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';

export function useEthereumRefundCallback(rpid?: string, overrides?: ChainContextOverrides) {
    const { chainId, account } = useChainContext(overrides);

    return useAsyncFn(async () => {
        if (!rpid) return;

        const globalChainId = getChainId(config);
        if (globalChainId !== chainId) await switchChain(config, { chainId });

        const hash = await writeContract(config, {
            abi: RED_PACKET_ABI,
            functionName: 'refund',
            address: getRedPacketContractAddress(chainId),
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
