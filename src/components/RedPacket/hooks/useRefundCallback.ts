import { getRedPacketConstant } from '@masknet/web3-shared-evm';
import { produce } from 'immer';
import { useAsyncFn } from 'react-use';
import type { Address } from 'viem';
import { getChainId, switchChain, writeContract } from 'wagmi/actions';

import { queryClient } from '@/configs/queryClient.js';
import { config } from '@/configs/wagmiClient.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { type ChainContextOverride, useChainContext } from '@/hooks/useChainContext.js';
import { HappyRedPacketV4ABI } from '@/mask/constants.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

export function useRefundCallback(rpid?: string, overrides?: ChainContextOverride) {
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

        queryClient.setQueriesData(
            { queryKey: ['redpacket-history', account, FireflyRedPacketAPI.ActionType.Send] },
            (
                old:
                    | {
                          pages: Array<{
                              data: Array<
                                  FireflyRedPacketAPI.RedPacketClaimedInfo | FireflyRedPacketAPI.RedPacketSentInfo
                              >;
                          }>;
                      }
                    | undefined,
            ) => {
                if (!old?.pages) return old;

                return produce(old, (draft) => {
                    for (const page of draft.pages) {
                        if (!page) continue;
                        for (const item of page.data) {
                            if (item.redpacket_id === rpid)
                                item.redpacket_status = FireflyRedPacketAPI.RedPacketStatus.Refund;
                        }
                    }
                });
            },
        );

        queryClient.refetchQueries({
            queryKey: ['red-packet', 'claim', rpid],
        });

        queryClient.refetchQueries({
            queryKey: ['red-packet', 'check-availability', chainId, 4, rpid, account],
        });
    }, [rpid, chainId, account]);
}
