'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { useEffect } from 'react';

import {
    captureOpinionEventOpenSuccess,
    capturePolymarketCategoryView,
    capturePolymarketEventOpenSuccess,
} from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface PolymarketEventTrackerProps {
    platform: PredictionPlatform;
    eventSlug: string;
    detail: BetsEventDataForUI;
}

export function PolymarketEventTracker({ platform, eventSlug, detail }: PolymarketEventTrackerProps) {
    useEffect(() => {
        if (platform === PredictionPlatform.Polymarket) {
            capturePolymarketEventOpenSuccess(eventSlug);
        } else if (platform === PredictionPlatform.Opinion) {
            captureOpinionEventOpenSuccess(eventSlug);
        }

        if (platform === PredictionPlatform.Polymarket && detail.tags) {
            detail.tags.forEach((tag) => {
                if (tag.slug && tag.label) {
                    capturePolymarketCategoryView(tag.slug, tag.label);
                }
            });
        }
    }, [platform, eventSlug, detail]);

    return null;
}
