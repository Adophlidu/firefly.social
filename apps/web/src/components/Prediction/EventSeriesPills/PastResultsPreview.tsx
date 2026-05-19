'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { Link } from '@/esm/Link.js';
import { constructPastMarketSlug } from '@/helpers/prediction/polymarket/eventSeriesPills/constructPastMarketSlug.js';
import { findMatchingPastEvent } from '@/helpers/prediction/polymarket/eventSeriesPills/findMatchingPastEvent.js';
import { resolvePastMarketVariant } from '@/helpers/prediction/polymarket/eventSeriesPills/resolvePastMarketVariant.js';
import type {
    PastOutcome,
    PastResultRow,
    SeriesEventForPills,
} from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';
import { resolvePredictionEventUrl } from '@/helpers/resolvePredictionEventUrl.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface PastResultsPreviewProps {
    currentSlug: string;
    pastEvents: SeriesEventForPills[];
    results: PastResultRow[];
    outcomesBySlug: Map<string, PastOutcome>;
    isDailyUpOrDown: boolean;
    uiBySlug: Map<string, BetsEventDataForUI>;
}

/** Polymarket `ez` — outcome dots on the Past trigger. */
export const PastResultsPreview = memo<PastResultsPreviewProps>(function PastResultsPreview({
    currentSlug,
    pastEvents,
    results,
    outcomesBySlug,
    isDailyUpOrDown,
    uiBySlug,
}) {
    if (!results.length) return null;

    const variant = resolvePastMarketVariant(currentSlug);
    if (!variant) return null;

    const preview = results.slice(-3);

    return (
        <div className="hidden items-center gap-1 lg:flex">
            {preview.map((row, index) => {
                const matched = findMatchingPastEvent(row, pastEvents, isDailyUpOrDown);
                const targetSlug =
                    matched?.slug ?? constructPastMarketSlug(currentSlug, row.startTime, row.endTime, variant);
                const outcome = (matched ? outcomesBySlug.get(matched.slug) : undefined) ?? row.outcome;
                const uiEvent = matched ? uiBySlug.get(matched.slug) : uiBySlug.get(targetSlug);

                return (
                    <Link
                        key={`${row.startTime}-${row.endTime}-${index}`}
                        href={uiEvent ? resolvePredictionEventUrl(uiEvent) : `#`}
                        className={classNames(
                            'flex size-[15px] items-center justify-center rounded-full text-white',
                            outcome === 'up' ? 'bg-success' : 'bg-danger',
                        )}
                    >
                        <span className="text-[10px] font-bold">{outcome === 'up' ? '↑' : '↓'}</span>
                    </Link>
                );
            })}
        </div>
    );
});
