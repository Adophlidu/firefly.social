import { Trans } from '@lingui/react/macro';

import { ActionButton } from '@/components/ActionButton.js';
import { useRefundCallback } from '@/components/RedPacket/hooks/useRefundCallback.js';
import type { NetworkType } from '@/constants/enum.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

interface Props {
    rpid: string;
    account: string;
    redpacketStatus: FireflyRedPacketAPI.RedPacketStatus;
    chainId: number;
    // TODO: mark this required
    networkType?: NetworkType;
}

export function RedPacketActionButton({ rpid, redpacketStatus, chainId, networkType }: Props) {
    const statusToTransMap = {
        [FireflyRedPacketAPI.RedPacketStatus.Send]: <Trans>Send</Trans>,
        [FireflyRedPacketAPI.RedPacketStatus.Expired]: <Trans>Expired</Trans>,
        [FireflyRedPacketAPI.RedPacketStatus.Empty]: <Trans>Empty</Trans>,
        [FireflyRedPacketAPI.RedPacketStatus.Refund]: <Trans>Refunded</Trans>,
        [FireflyRedPacketAPI.RedPacketStatus.View]: <Trans>View</Trans>,
        [FireflyRedPacketAPI.RedPacketStatus.Refunding]: <Trans>Refund</Trans>,
    };

    const [{ loading: refundLoading }, refund] = useRefundCallback(rpid, { chainId, networkType });

    if (
        redpacketStatus === FireflyRedPacketAPI.RedPacketStatus.Send ||
        redpacketStatus === FireflyRedPacketAPI.RedPacketStatus.View
    )
        return;

    return (
        <ActionButton
            className="h-[32px] !w-[88px] min-w-[88px] !grow-0 px-6 py-2 text-xs"
            loading={refundLoading}
            onClick={() => {
                if (redpacketStatus === FireflyRedPacketAPI.RedPacketStatus.Refunding) refund();
            }}
            disabled={[
                FireflyRedPacketAPI.RedPacketStatus.Empty,
                FireflyRedPacketAPI.RedPacketStatus.Expired,
                FireflyRedPacketAPI.RedPacketStatus.Refund,
            ].includes(redpacketStatus)}
        >
            {statusToTransMap[redpacketStatus]}
        </ActionButton>
    );
}
