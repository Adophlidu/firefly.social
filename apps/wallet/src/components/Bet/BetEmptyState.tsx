import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Trans } from '@lingui/react/macro';

interface Props {
    message?: React.ReactNode;
}

export function BetEmptyState({ message }: Props) {
    return (
        <div className="flex w-full flex-col items-center gap-3">
            <div className="text-second text-base font-semibold leading-6">{message}</div>
            <button
                type="button"
                className="bg-main text-primaryBottom h-10 w-[319px] max-w-full rounded-full text-sm font-bold leading-5"
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
