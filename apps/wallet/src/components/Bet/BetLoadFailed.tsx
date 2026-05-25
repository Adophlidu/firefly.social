import LoadFailedIcon from '@dimensiondev/assets/bet-load-failed.svg';
import { Trans } from '@lingui/react/macro';

import { Button } from '@/components/ui/button.js';

export function BetLoadFailed({ reset }: { reset?: () => void }) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex w-[160px] flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                    <LoadFailedIcon width={160} height={128} className="text-third" />
                    <div className="w-full text-center text-sm font-semibold leading-5 text-third">
                        <Trans>Load failed</Trans>
                    </div>
                </div>
                {reset ? (
                    <Button
                        type="button"
                        variant="secondary"
                        className="h-auto rounded-[40px] bg-bg px-5 py-1 text-sm font-bold text-main hover:bg-bg"
                        onClick={() => reset()}
                    >
                        <Trans>Reload</Trans>
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
