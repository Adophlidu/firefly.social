import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Trans } from '@lingui/react/macro';

import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';

interface Props {
    message?: React.ReactNode;
    proxyAddress?: string;
}

export function BetEmptyState({ message, proxyAddress }: Props) {
    return (
        <div className="flex w-full flex-col items-center gap-3">
            <div className="text-base font-semibold leading-6 text-second">{message}</div>
            <button
                type="button"
                className="h-10 w-[319px] max-w-full rounded-full bg-main text-sm font-bold leading-5 text-primaryBottom"
                onClick={() => {
                    captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_EXPLORE_BETS_OPEN_SUCCESS, {
                        proxy_wallet_address: proxyAddress ?? '',
                    });
                    iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
                        path: '/prediction/category/trending',
                    });
                }}
            >
                <Trans>Explore markets</Trans>
            </button>
        </div>
    );
}
