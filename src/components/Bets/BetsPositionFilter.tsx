'use client';

import { Trans } from '@lingui/react/macro';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { memo } from 'react';

import RadioOff from '@/assets/radio.disable-no.svg';
import RadioOn from '@/assets/radio.yes.svg';

export const BetsPositionFilter = memo(function BetsPositionFilter() {
    const [onlyHolding, setOnlyHolding] = useQueryState('holding', parseAsBoolean.withDefault(false));

    return (
        <label
            role="button"
            className="mb-3 flex cursor-pointer items-center gap-1"
            onClick={() => setOnlyHolding((prev) => !prev)}
        >
            {onlyHolding ? (
                <RadioOn className="size-4 text-highlight" />
            ) : (
                <RadioOff className="size-4 text-secondaryLine" />
            )}
            <span className="cursor-pointer select-none text-xs font-bold text-second">
                <Trans>Only show holding</Trans>
            </span>
        </label>
    );
});
