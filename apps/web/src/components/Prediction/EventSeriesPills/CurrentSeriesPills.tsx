'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { ActiveTag } from '@/components/Prediction/PredictionSeries/ActiveTag.js';
import { Link } from '@/esm/Link.js';
import {
    formatCurrentPillTime,
    splitAmPmTime,
} from '@/helpers/prediction/polymarket/eventSeriesPills/formatSeriesPillTime.js';
import { toSeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/toSeriesEventForPills.js';
import { resolvePredictionEventUrl } from '@/helpers/resolvePredictionEventUrl.js';
import { capturePolymarketEventCryptoRecurrenceClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface CurrentSeriesPillsProps {
    events: BetsEventDataForUI[];
    eventSlug: string;
    shouldShowLive: (slug: string) => boolean;
}

export const CurrentSeriesPills = memo<CurrentSeriesPillsProps>(function CurrentSeriesPills({
    events,
    eventSlug,
    shouldShowLive,
}) {
    if (!events.length) return null;

    return (
        <>
            {events.map((event) => {
                const label = formatCurrentPillTime(toSeriesEventForPills(event));
                const { main, period, suffix } = splitAmPmTime(label ?? '');
                const isSelected = event.slug === eventSlug;
                const isLive = shouldShowLive(event.slug ?? '');

                return (
                    <Link
                        key={event.id}
                        className={classNames(
                            'flex h-[30px] items-center gap-1 rounded-full px-3 text-[10px] font-bold',
                            isSelected ? 'bg-main text-primaryBottom' : 'text-main hover:bg-lightBg',
                        )}
                        href={resolvePredictionEventUrl(event)}
                        onClick={() => {
                            if (event.slug) capturePolymarketEventCryptoRecurrenceClick(event.slug, label ?? '');
                        }}
                    >
                        {isLive ? <ActiveTag /> : null}
                        <span>
                            {main}
                            {period ? <span className="text-[9px]"> {period}</span> : null}
                            {suffix}
                        </span>
                    </Link>
                );
            })}
        </>
    );
});
