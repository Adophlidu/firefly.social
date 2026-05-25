'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { anySignal } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { PredictionTopHoldersUI } from '@/components/Prediction/PredictionMarketTopHolders/PredictionTopHoldersUI.js';
import { STALE_TIMES } from '@/constants/query.js';
import { getBetsMarketTopHolders } from '@/providers/prediction/getBetsMarketTopHolders.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

interface TopHoldersContentProps {
    platform: PredictionPlatform;
    market: BetsMarketDataForUI;
}

export const TopHoldersContent = memo<TopHoldersContentProps>(function TopHoldersContent({ platform, market }) {
    const { data, error, isLoading, isRefetchError, isPending, refetch } = useQuery({
        queryKey: ['bets', 'top-holders', platform, market.id],
        staleTime: STALE_TIMES.MINUTE_5,
        retry: false,
        queryFn: async ({ signal }) =>
            getBetsMarketTopHolders(platform, {
                market,
                signal: anySignal(AbortSignal.timeout(1000 * 5), signal),
            }),
    });

    if (isLoading || isRefetchError || isPending) return <Loading minHeight={112} />;
    if (error) {
        return (
            <div className="flex h-28 w-full items-center justify-center">
                <ClickableButton
                    onClick={() => refetch()}
                    className="text-sm font-semibold text-second hover:underline"
                >
                    <Trans>Retry</Trans>
                </ClickableButton>
            </div>
        );
    }

    const allHolders = market.outcomes.map((x) => {
        const holders = data?.find((item) => item.outcome.id === x.id)?.holders || [];
        return { outcome: x, holders };
    });

    return (
        <div className="flex">
            {allHolders.map(({ outcome, holders }, i) => (
                <div key={outcome.id} className="min-w-0 flex-1 shrink-0">
                    <PredictionTopHoldersUI
                        isYes={i === 0}
                        platform={PredictionPlatform.Polymarket}
                        holders={holders}
                        outcomeLabel={outcome.label}
                    />
                </div>
            ))}
        </div>
    );
});
