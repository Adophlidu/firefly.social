'use client';

import { memo } from 'react';

import { BetItem } from '@/components/BetItem.js';
import { type BetsEventDataForUI } from '@/types/prediction.js';

interface PredictionEventCardProps {
    event: BetsEventDataForUI;
}

export const PredictionEventCard = memo<PredictionEventCardProps>(function PredictionEventCard({ event }) {
    return <BetItem event={event} platform={event.platform} className="mt-2" openLinkInNewTab={false} />;
});
