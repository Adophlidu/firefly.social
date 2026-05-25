'use client';

import { memo } from 'react';

import type { SportEventData } from '@/types/prediction.js';

interface SportEventOverviewProps {
    sportData: SportEventData;
}

export const SportEventOverview = memo(function SportEventOverview({ sportData }: SportEventOverviewProps) {
    const { homeTeam, awayTeam } = sportData;

    return (
        <div className="flex items-start gap-4 p-4">
            <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold leading-6 text-main">
                    {homeTeam.name || homeTeam.abbreviation || 'Home'} vs{' '}
                    {awayTeam.name || awayTeam.abbreviation || 'Away'}
                </h1>
            </div>
        </div>
    );
});
