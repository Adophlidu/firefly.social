import AppleIcon from '@dimensiondev/assets/apple-small.svg';
import FireflyLogo from '@dimensiondev/assets/firefly-small.svg';
import GoogleStoreIcon from '@dimensiondev/assets/google-store.svg';
import { Trans } from '@lingui/react/macro';
import QRCode from 'react-qr-code';

import { SquareButton } from '@/app/[locale]/(whiteboard)/components/Signup/SquareButton.js';
import { openWindow } from '@/helpers/openWindow.js';

export function DownloadMobileAppContent() {
    return (
        <div className="px-6 pb-6">
            <div className="mx-auto mt-0 flex max-w-60 flex-col items-center gap-4">
                <p className="text-second text-sm">
                    <Trans>Scan the QR code with your phone to download the app</Trans>
                </p>
                <div className="relative rounded-lg bg-white p-3">
                    <QRCode value="https://5euxu.app.link/PHvNiyVemIb" size={170} />
                    <div className="absolute left-1/2 top-1/2 flex size-[45px] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-white">
                        <FireflyLogo width={28} height={36} />
                    </div>
                </div>
                <span className="text-second text-sm">
                    <Trans>or</Trans>
                </span>
            </div>
            <div className="mt-6 flex justify-center gap-6">
                <SquareButton
                    className="flex !h-8 !w-[110px] items-center gap-[3px]"
                    onClick={() => {
                        openWindow('https://apps.apple.com/us/app/firefly-web3-nft-explorer/id1640183078');
                    }}
                >
                    <AppleIcon className="text-white dark:text-black" width={19} height={19} />
                    <span className="text-[11px] font-semibold text-white dark:text-black">
                        <Trans>App Store</Trans>
                    </span>
                </SquareButton>
                <SquareButton
                    className="flex !h-8 !w-[110px] items-center gap-[3px]"
                    onClick={() => {
                        openWindow('https://play.google.com/store/apps/details?id=io.dimension.firefly');
                    }}
                >
                    <GoogleStoreIcon width={19} height={19} />
                    <span className="text-[11px] font-semibold text-white dark:text-black">
                        <Trans>Google Play</Trans>
                    </span>
                </SquareButton>
            </div>
        </div>
    );
}
