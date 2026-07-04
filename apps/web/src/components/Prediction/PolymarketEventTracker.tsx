'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { useEffect } from 'react';

import {
    captureOpinionEventOpenSuccess,
    capturePolymarketCategoryView,
    capturePolymarketEventOpenSuccess,
} from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetsEventTagForUI } from '@/types/prediction.js';

interface PolymarketEventTrackerProps {
    platform: PredictionPlatform;
    eventSlug: string;
    tags?: BetsEventTagForUI[];
}

export function PolymarketEventTracker({ platform, eventSlug, tags }: PolymarketEventTrackerProps) {
    useEffect(() => {
        if (platform === PredictionPlatform.Polymarket) {
            capturePolymarketEventOpenSuccess(eventSlug);
        } else if (platform === PredictionPlatform.Opinion) {
            captureOpinionEventOpenSuccess(eventSlug);
        }

        if (platform === PredictionPlatform.Polymarket && tags) {
            tags.forEach((tag) => {
                if (tag.slug && tag.label) {
                    capturePolymarketCategoryView(tag.slug, tag.label);
                }
            });
        }
    }, [platform, eventSlug, tags]);

    return null;
}
