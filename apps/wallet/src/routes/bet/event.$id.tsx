import { Link, useParams } from '@dimensiondev/ssr';
import { Trans } from '@lingui/react/macro';
import { lazy, Suspense } from 'react';

import { BetEventLoading } from '@/components/Bet/BetEventLoading.js';
import { Button } from '@/components/ui/button.js';

// Lazy load the client component
const BetEventClient = lazy(() => import('@/components/Bet/BetEventClient.js'));

export default function BetEventPage() {
    const { id } = useParams();

    return (
        <Suspense fallback={<BetEventLoading />}>
            <BetEventClient key={id} id={id ?? ''} />
        </Suspense>
    );
}

// Kept for reuse: shown when a market lookup fails inside BetEventClient flows.
export function BetEventNotFound() {
    return (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="text-xl font-bold text-main">
                <Trans>Market not found</Trans>
            </div>
            <div className="text-sm text-second">
                <Trans>This market may have been removed or the link is invalid.</Trans>
            </div>
            <Button asChild size="lg" className="w-full max-w-[360px] rounded-full font-bold">
                <Link href="/bet">
                    <Trans>Back to Bets</Trans>
                </Link>
            </Button>
        </div>
    );
}
