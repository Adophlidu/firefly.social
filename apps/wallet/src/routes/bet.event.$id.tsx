import { Trans } from '@lingui/react/macro';
import { createFileRoute, Link } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { z } from 'zod';

import { BetError } from '@/components/Bet/BetError.js';
import { BetEventLoading } from '@/components/Bet/BetEventLoading.js';
import { Button } from '@/components/ui/button.js';
import { MarketNotFoundError } from '@/constants/error.js';

// Lazy load the client component
const BetEventClient = lazy(() => import('@/components/Bet/BetEventClient.js'));

const betEventSearchSchema = z
    .object({
        side: z.string().optional(),
        type: z.string().optional(),
        outcome: z.string().optional(),
        eventSlug: z.string().optional(),
        conditionId: z.string().optional(),
        limitPrice: z.string().optional(),
    })
    .passthrough();

export const Route = createFileRoute('/bet/event/$id')({
    component: BetEventPage,
    pendingComponent: BetEventLoading,
    errorComponent: BetEventError,
    notFoundComponent: BetEventNotFound,
    validateSearch: betEventSearchSchema,
});

function BetEventPage() {
    const { id } = Route.useParams();

    return (
        <Suspense fallback={<BetEventLoading />}>
            <BetEventClient key={id} id={id} />
        </Suspense>
    );
}

function BetEventError({ error, reset }: { error: Error; reset?: () => void }) {
    if (error instanceof MarketNotFoundError) {
        return <BetEventNotFound />;
    }
    return <BetError error={error} reset={reset} />;
}

function BetEventNotFound() {
    return (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="text-xl font-bold text-main">
                <Trans>Market not found</Trans>
            </div>
            <div className="text-sm text-second">
                <Trans>This market may have been removed or the link is invalid.</Trans>
            </div>
            <Button asChild size="lg" className="w-full max-w-[360px] rounded-full font-bold">
                <Link to="/bet">
                    <Trans>Back to Bets</Trans>
                </Link>
            </Button>
        </div>
    );
}
