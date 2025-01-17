import { t } from '@lingui/core/macro';
import { unreachable } from '@masknet/kit';
import { produce } from 'immer';
import { useAsyncFn } from 'react-use';

import { useRefundEvmCallback } from '@/components/RedPacket/hooks/useRefundEvmCallback.js';
import { useRefundSolanaCallback } from '@/components/RedPacket/hooks/useRefundSolanaCallback.js';
import { queryClient } from '@/configs/queryClient.js';
import { NetworkType } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { type ChainContextOverride, useChainContext } from '@/hooks/useChainContext.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

export function useRefundCallback(rpid?: string, overrides?: ChainContextOverride) {
    const [, refundEVM] = useRefundEvmCallback(rpid, overrides);
    const [, refundSolana] = useRefundSolanaCallback(rpid, overrides);
    const { account } = useChainContext(overrides);

    const networkType = overrides?.networkType ?? NetworkType.Ethereum;

    return useAsyncFn(async () => {
        try {
            switch (networkType) {
                case NetworkType.Ethereum:
                    await refundEVM();
                    break;
                case NetworkType.Solana:
                    await refundSolana();
                    break;
                default:
                    unreachable(networkType);
            }

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

            enqueueSuccessMessage(t`Refund successfully.`);
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to refund red packet.`);
            throw error;
        }
    }, [rpid, account, networkType, refundEVM, refundSolana]);
}
