'use client';

import { memo } from 'react';

import { PredictionProfileCardUI } from '@/components/Prediction/PredictionProfileCardUI.js';
import { type BetPortfolioItem } from '@/providers/types/Firefly.js';

interface PredictionProfileCardProps {
    profile: BetPortfolioItem;
}

export const PredictionProfileCard = memo<PredictionProfileCardProps>(function PredictionProfileCard({ profile }) {
    return (
        <div className="mt-2">
            <PredictionProfileCardUI profile={profile} />
        </div>
    );
});
