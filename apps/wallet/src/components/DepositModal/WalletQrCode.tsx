import InfoIcon from '@dimensiondev/assets/info-outline.svg';
import { formatAddressEthereum } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import { memo } from 'react';
import QRCode from 'react-qr-code';

import { Button } from '@/components/ui/button.js';
import { useCopyText } from '@/hooks/useCopyText.js';
import { evmWalletAddressAtom } from '@/store/embeddedWallets.js';

export const WalletQrCode = memo(function WalletQrCode() {
    const evmAddress = useAtomValue(evmWalletAddressAtom);
    const [copied, handleCopy] = useCopyText(evmAddress || '');

    if (!evmAddress) return null;

    return (
        <div className="space-y-4">
            <p className="text-main text-center text-sm">
                <Trans>Scan this code or copy your wallet address to receive funds on Ethereum.</Trans>
            </p>
            <div className="border-main mx-auto flex size-[200px] items-center justify-center rounded-xl border">
                <QRCode value={evmAddress} size={180} />
            </div>
            <div className="bg-lightBg flex items-center gap-3 rounded-xl p-4">
                <InfoIcon className="size-5 shrink-0" />
                <span className="text-main min-w-0 flex-1 text-sm">
                    <Trans>Make sure to send funds on Ethereum.</Trans>
                </span>
            </div>
            <div className="border-line flex h-14 items-center justify-between rounded-xl border px-3">
                <span className="text-main text-sm">{formatAddressEthereum(evmAddress, 6)}</span>
                <Button
                    variant="outline"
                    className="border-highlight hover:bg-highlight/20 text-highlight h-7 text-sm"
                    onClick={() => handleCopy()}
                >
                    {copied ? <Trans>Copied</Trans> : <Trans>Copy</Trans>}
                </Button>
            </div>
        </div>
    );
});
