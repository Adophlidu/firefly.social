import { Trans } from '@lingui/react/macro';

import { ActionButton } from '@/components/ActionButton.js';
import { useRefundCallback } from '@/components/RedPacket/hooks/useRefundCallback.js';
import {
    type ResendRedPacketInfo,
    useResendRedPacketCallback,
} from '@/components/RedPacket/hooks/useResendRedPacketCallback.js';
import { type NetworkType } from '@/constants/enum.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

interface Props {
    rpid: string;
    account: string;
    redpacketStatus: FireflyRedPacketAPI.RedPacketStatus;
    chainId: number;
    networkType: NetworkType;
    resendInfo?: Omit<ResendRedPacketInfo, 'rpid' | 'chainId' | 'networkType'>;
}

export function RedPacketActionButton({ rpid, redpacketStatus, chainId, networkType, resendInfo }: Props) {
    const statusToTransMap = {
        [FireflyRedPacketAPI.RedPacketStatus.Send]: <Trans>Send</Trans>,
        [FireflyRedPacketAPI.RedPacketStatus.Expired]: <Trans>Expired</Trans>,
        [FireflyRedPacketAPI.RedPacketStatus.Empty]: <Trans>Empty</Trans>,
        [FireflyRedPacketAPI.RedPacketStatus.Refund]: <Trans>Refunded</Trans>,
        [FireflyRedPacketAPI.RedPacketStatus.View]: <Trans>View</Trans>,
        [FireflyRedPacketAPI.RedPacketStatus.Refunding]: <Trans>Refund</Trans>,
    };

    const [{ loading: refundLoading }, refund] = useRefundCallback(rpid, { chainId, networkType });

    const resendFullInfo = {
        rpid,
        chainId,
        networkType: networkType!,
        message: resendInfo?.message ?? '',
        shareFrom: resendInfo?.shareFrom ?? '',
        themeId: resendInfo?.themeId ?? '',
        tokenSymbol: resendInfo?.tokenSymbol ?? '',
        tokenDecimal: resendInfo?.tokenDecimal ?? 18,
        totalAmounts: resendInfo?.totalAmounts ?? '0',
        totalNumbers: resendInfo?.totalNumbers ?? '0',
        claimStrategy: resendInfo?.claimStrategy ?? [],
    };

    const [{ loading: resendLoading }, resend] = useResendRedPacketCallback(resendFullInfo);

    if (redpacketStatus === FireflyRedPacketAPI.RedPacketStatus.View) return null;

    if (redpacketStatus === FireflyRedPacketAPI.RedPacketStatus.Send) {
        return (
            <ActionButton
                className="h-[32px] !w-[88px] min-w-[88px] !grow-0 px-6 py-2 text-xs"
                loading={resendLoading}
                onClick={resend}
            >
                <Trans>Send</Trans>
            </ActionButton>
        );
    }

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
