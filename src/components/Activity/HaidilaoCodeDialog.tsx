'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import QRCode from 'react-qr-code';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { FireflyActivityProvider } from '@/providers/firefly/Activity.js';

interface HaidilaoCodeDialogProps {
    open: boolean;
    onClose: () => void;
}

export function HaidilaoCodeDialog(props: HaidilaoCodeDialogProps) {
    return (
        <Modal
            open={props.open}
            onClose={props.onClose}
            size="sm"
            title={<Trans>Redeem Code</Trans>}
            enableClose
            className="max-md:h-svh max-md:w-full"
            panelClassName="h-full"
        >
            {props.open ? <HaidilaoCodeContent /> : <div className="h-[332px] w-full" />}
        </Modal>
    );
}

function HaidilaoCodeContent() {
    dayjs.extend(utc);
    const { data, isLoading } = useQuery({
        queryKey: ['haidilao-code'],
        async queryFn() {
            return FireflyActivityProvider.searchQrcode('haidilao');
        },
        select(data) {
            return data.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex size-full flex-col items-center justify-center md:h-[332px]">
                <LoadingIcon />
            </div>
        );
    }

    return (
        <div className="flex size-full flex-col items-center justify-center p-6 md:h-[332px]">
            {data?.qrcode ? (
                <>
                    <div className="size-[270px] rounded-2xl bg-white p-4">
                        <QRCode value={data.qrcode.qrcode} size={238} />
                    </div>
                    <div className="mt-3 text-base font-bold">
                        <Trans>
                            Code: {data.qrcode.qrcode} {data.qrcode.redeemedAt ? '(Used)' : ''}
                        </Trans>
                    </div>
                    <div className="text-xs">
                        <Trans>
                            Valid until: {dayjs(data.qrcode.validateTill).utc().format('YYYY/MM/DD HH:mm')} (UTC)
                        </Trans>
                    </div>
                </>
            ) : (
                <div>
                    <Trans>The code not found</Trans>
                </div>
            )}
        </div>
    );
}
