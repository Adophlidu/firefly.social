import QrCodeIcon from '@dimensiondev/assets/qrcode.svg';
import { Trans } from '@lingui/react/macro';
import { useIsMutating } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { memo } from 'react';

import { Button, type ButtonProps } from '@/components/ui/button.js';
import { cn } from '@/lib/utils.js';
import { evmWalletAddressAtom } from '@/store/embeddedWallets.js';

export const QrCodeEntrance = memo<ButtonProps>(function QrCodeEntrance({ className, ...props }) {
    const evmAddress = useAtomValue(evmWalletAddressAtom);
    const isMutating = useIsMutating({ mutationKey: ['buyer-token', evmAddress?.toLowerCase()], exact: true }) > 0;

    return (
        <Button
            variant="outline"
            className={cn('hover:bg-lightBg flex h-14 w-full items-center justify-start gap-3', className)}
            disabled={!evmAddress || isMutating}
            {...props}
        >
            <QrCodeIcon className="text-main size-6" width={24} height={24} />
            <span className="text-main text-base">
                <Trans>Receive funds</Trans>
            </span>
        </Button>
    );
});
