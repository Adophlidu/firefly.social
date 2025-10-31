import { classNames } from '@dimensiondev/utils';
import QRCode from 'react-qr-code';

import ReloadIcon from '@/assets/reload.svg';

interface Props {
    size?: number;
    iconSize?: number;
    url: string;
    scanned: boolean;
    countdown: number;
    showReload?: boolean;
}

export function ScannableQRCode(props: Props) {
    const { url, size = 238, iconSize = 80, scanned, countdown, showReload = false } = props;
    return (
        <div className="relative flex items-center justify-center">
            <div
                className={classNames(
                    'rounded-2xl bg-white p-4',
                    countdown === 0 || scanned || showReload ? 'blur-md' : '',
                )}
            >
                <QRCode value={url} size={size} />
            </div>
            {countdown === 0 || showReload ? (
                <ReloadIcon className="absolute inset-0 m-auto text-white" width={iconSize} height={iconSize} />
            ) : null}
        </div>
    );
}
