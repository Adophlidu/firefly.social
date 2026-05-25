'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import type { SportTeam } from '@/types/prediction.js';

interface SportTeamDisplayProps {
    homeTeam: SportTeam;
    awayTeam: SportTeam;
    className?: string;
}

function TeamLogo({ team, size = 32 }: { team: SportTeam; size?: number }) {
    return (
        <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{
                width: size,
                height: size,
                backgroundColor: team.color ? `${team.color}15` : '#f0f0f0',
            }}
        >
            {team.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={team.logo} alt={team.abbreviation || ''} width={size * 0.6} height={size * 0.6} />
            ) : (
                <span className="text-xs font-bold" style={{ color: team.color || '#666' }}>
                    {(team.abbreviation || team.name || '?')[0]}
                </span>
            )}
        </div>
    );
}

export const SportTeamDisplay = memo(function SportTeamDisplay({
    homeTeam,
    awayTeam,
    className,
}: SportTeamDisplayProps) {
    return (
        <div className={classNames('flex items-center justify-between gap-3', className)}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <TeamLogo team={homeTeam} />
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-5 text-lightMain">
                        {homeTeam.abbreviation || homeTeam.name || 'Home'}
                    </p>
                    {homeTeam.record ? <p className="text-xs leading-4 text-second">{homeTeam.record}</p> : null}
                </div>
            </div>
            <span className="text-xs font-medium text-third">vs</span>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                <div className="min-w-0 text-right">
                    <p className="truncate text-sm font-semibold leading-5 text-lightMain">
                        {awayTeam.abbreviation || awayTeam.name || 'Away'}
                    </p>
                    {awayTeam.record ? <p className="text-xs leading-4 text-second">{awayTeam.record}</p> : null}
                </div>
                <TeamLogo team={awayTeam} />
            </div>
        </div>
    );
});
