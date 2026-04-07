import LoadFailedIcon from '@dimensiondev/assets/bet-load-failed.svg';
import { type ErrorPageProps } from '@dimensiondev/types';
import { Trans } from '@lingui/react/macro';

import { Button } from '@/components/ui/button.js';

export function GlobalError({ reset }: ErrorPageProps) {
    return (
        <div className="flex w-full flex-1 items-center justify-center">
            <div className="flex w-[160px] flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                    <LoadFailedIcon width={160} height={128} className="text-third" />
                    <div className="text-third w-full text-center text-sm font-semibold leading-5">
                        <Trans>Something went wrong</Trans>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    className="bg-bg text-main hover:bg-bg h-auto rounded-[40px] px-5 py-1 text-sm font-bold"
                    onClick={() => reset()}
                >
                    <Trans>Reload</Trans>
                </Button>
            </div>
        </div>
    );
}
