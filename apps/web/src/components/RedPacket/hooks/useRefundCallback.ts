import { unreachable } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { produce } from 'immer';
import { useAsyncFn } from 'react-use';

import { useEthereumRefundCallback } from '@/components/RedPacket/hooks/useEthereumRefundCallback.js';
import { useRefundSolanaCallback } from '@/components/RedPacket/hooks/useRefundSolanaCallback.js';
import { queryClient } from '@/configs/queryClient.js';
import { NetworkType } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';
import { captureLuckyDropEvent } from '@/providers/telemetry/captureLuckyDropEvent.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

export function useRefundCallback(rpid?: string, overrides?: ChainContextOverrides) {
    const [, refundEVM] = useEthereumRefundCallback(rpid, overrides);
    const [, refundSolana] = useRefundSolanaCallback(rpid, overrides);
    const { account } = useChainContext(overrides);

    const networkType = overrides?.networkType ?? NetworkType.Ethereum;

    return useAsyncFn(async () => {
        try {
            captureLuckyDropEvent('pre-refund', {
                claimer: account,
            });

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

            captureLuckyDropEvent('refund', {
                claimer: account,
            });
            queryClient.setQueriesData(
                { queryKey: ['redpacket-history', account.toLowerCase(), FireflyRedPacketAPI.ActionType.Send] },
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
