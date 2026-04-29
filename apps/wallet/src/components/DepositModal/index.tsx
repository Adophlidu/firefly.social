import LeftArrowIcon from '@dimensiondev/assets/left-arrow.svg';
import { Trans } from '@lingui/react/macro';
import { memo, useCallback, useState } from 'react';

import { ExchangeEntrance } from '@/components/DepositModal/ExchangeEntrance.js';
import { QrCodeEntrance } from '@/components/DepositModal/QrCodeEntrance.js';
import { WalletQrCode } from '@/components/DepositModal/WalletQrCode.js';
import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
    DialogOrDrawerTopButton,
} from '@/components/DialogOrDrawer.js';

interface DepositModalProps {
    open: boolean;
    onClose: () => void;
}

export const DepositModal = memo<DepositModalProps>(function DepositModal({ open, onClose }) {
    const [method, setMethod] = useState<'exchange' | 'qr-code' | null>(null);

    const onQrCodeEntranceClick = useCallback(() => {
        setMethod('qr-code');
    }, []);

    return (
        <DialogOrDrawer
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    onClose();
                    setMethod(null);
                }
            }}
        >
            <DialogOrDrawerContent>
                <DialogOrDrawerHeader closeButton={!method}>
                    {method ? (
                        <DialogOrDrawerTopButton Icon={LeftArrowIcon} alt="back" onClick={() => setMethod(null)} />
                    ) : null}
                    <DialogOrDrawerTitle>
                        <Trans>Deposit</Trans>
                    </DialogOrDrawerTitle>
                </DialogOrDrawerHeader>
                <div
                    className="transition-all"
                    style={{
                        height: !method ? 130 : 400,
                    }}
                >
                    {!method ? (
                        <div className="space-y-3">
                            <ExchangeEntrance />
                            <QrCodeEntrance onClick={onQrCodeEntranceClick} />
                        </div>
                    ) : null}
                    {method === 'qr-code' ? <WalletQrCode /> : null}
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
});
