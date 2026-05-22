'use client';

import { memo } from 'react';

import type { SportTeam } from '@/types/prediction.js';

interface SportScoreBarProps {
    homeTeam: SportTeam;
    awayTeam: SportTeam;
    homePrice: number;
    awayPrice: number;
    drawPrice?: number;
}

export const SportScoreBar = memo(function SportScoreBar({
    homeTeam,
    awayTeam,
    homePrice,
    awayPrice,
    drawPrice,
}: SportScoreBarProps) {
    const hasDraw = drawPrice !== undefined && drawPrice > 0;
    const total = homePrice + awayPrice + (hasDraw ? drawPrice : 0);
    if (total === 0) return null;

    const homePct = (homePrice / total) * 100;
    const awayPct = (awayPrice / total) * 100;
    const drawPct = hasDraw ? (drawPrice / total) * 100 : 0;

    return (
        <div className="flex h-1.5 overflow-hidden rounded-full">
            <div
                className="h-full rounded-l-full"
                style={{
                    width: `${homePct}%`,
                    backgroundColor: homeTeam.color || '#E74C3C',
                }}
            />
            {hasDraw ? <div className="h-full bg-[#9CA3AF]" style={{ width: `${drawPct}%` }} /> : null}
            <div
                className="h-full rounded-r-full"
                style={{
                    width: `${awayPct}%`,
                    backgroundColor: awayTeam.color || '#2ECC71',
                }}
            />
        </div>
    );
});
