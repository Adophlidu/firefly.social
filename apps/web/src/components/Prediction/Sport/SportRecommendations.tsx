'use client';

import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import { SportActivityCell } from '@/components/Prediction/Sport/SportActivityCell.js';
import { formatPolymarketEvent } from '@/providers/firefly/prediction/formatEvents.js';
import type { PolymarketEvent } from '@/providers/prediction/polymarket/type.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface SportRecommendationsProps {
    events: PolymarketEvent[];
}

export const SportRecommendations = memo(function SportRecommendations({ events }: SportRecommendationsProps) {
    const formattedEvents = useMemo(
        () => events.map((e) => formatPolymarketEvent(e)).filter(Boolean) as BetsEventDataForUI[],
        [events],
    );

    if (formattedEvents.length === 0) return null;

    return (
        <div className="px-4">
            <h3 className="text-lightMain mb-3 text-sm font-semibold">
                <Trans>You might like</Trans>
            </h3>
            <div className="flex flex-col gap-3">
                {formattedEvents.map((event) => (
                    <div key={event.id} className="border-line rounded-xl border p-3">
                        <SportActivityCell event={event} />
                    </div>
                ))}
            </div>
        </div>
    );
});
