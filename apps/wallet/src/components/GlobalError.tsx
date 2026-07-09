import LoadFailedIcon from '@dimensiondev/assets/bet-load-failed.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import type { ErrorPageProps } from '@dimensiondev/types';
import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button.js';
import { isRunningInIframe } from '@/helpers/isRunningInIframe.js';

// Kept in sync with the host subscriber in apps/web/src/components/FireflyWallet.tsx.
const WALLET_ERROR_NOTIFY_TYPE = 'wallet-error';

export function GlobalError({ reset }: ErrorPageProps) {
    useEffect(() => {
        if (!isRunningInIframe()) return;
        // Notify the host (apps/web) that the embedded wallet has crashed so it can
        // auto-reload this iframe when the page regains focus or the wallet is expanded.
        iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NOTIFY, {
            type: WALLET_ERROR_NOTIFY_TYPE,
        });
    }, []);

    return (
        <div className="flex w-full flex-1 items-center justify-center">
            <div className="flex w-[160px] flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                    <LoadFailedIcon width={160} height={128} className="text-third" />
                    <div className="w-full text-center text-sm font-semibold leading-5 text-third">
                        <Trans>Something went wrong</Trans>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    className="h-auto rounded-[40px] bg-bg px-5 py-1 text-sm font-bold text-main hover:bg-bg"
                    onClick={() => reset()}
                >
                    <Trans>Reload</Trans>
                </Button>
            </div>
        </div>
    );
}
