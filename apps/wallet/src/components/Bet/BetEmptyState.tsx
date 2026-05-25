import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Trans } from '@lingui/react/macro';

interface Props {
    message?: React.ReactNode;
}

export function BetEmptyState({ message }: Props) {
    return (
        <div className="flex w-full flex-col items-center gap-3">
            <div className="text-base font-semibold leading-6 text-second">{message}</div>
            <button
                type="button"
                className="h-10 w-[319px] max-w-full rounded-full bg-main text-sm font-bold leading-5 text-primaryBottom"
                onClick={() =>
                    iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
                        path: '/explore/prediction/trending',
                    })
                }
            >
                <Trans>Explore markets</Trans>
            </button>
        </div>
    );
}
