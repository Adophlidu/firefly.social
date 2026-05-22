'use client';

import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { memo } from 'react';

interface SportCellFooterProps {
    startTime?: string;
    volume: string | number;
    leagueName?: string;
}

export const SportCellFooter = memo(function SportCellFooter({ startTime, volume, leagueName }: SportCellFooterProps) {
    const vol = typeof volume === 'string' ? Number(volume) : volume;
    const formattedVol = `$${(vol / 1_000_000).toFixed(1)}M`;

    const formattedTime = startTime ? dayjs(new Date(startTime).getTime()).format('MMM D, h:mm A') : null;

    return (
        <div className="text-second flex items-center gap-2 text-xs leading-[14px]">
            {formattedTime ? <span>{formattedTime}</span> : null}
            <span>
                <Trans>{formattedVol} Vol.</Trans>
            </span>
            {leagueName ? <span>{leagueName}</span> : null}
        </div>
    );
});
