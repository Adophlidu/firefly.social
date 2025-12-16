'use client';

import { Trans } from '@lingui/react/macro';
import { parseAsBoolean, useQueryState } from 'nuqs';

import RadioOff from '@/assets/radio.disable-no.svg';
import RadioOn from '@/assets/radio.yes.svg';
import { Loading } from '@/components/Loading.js';

export default function PolymarketPositionList() {
    const [onlyHolding, setOnlyHolding] = useQueryState('holding', parseAsBoolean.withDefault(false));

    return (
        <div className="p-4">
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
            <Loading />
        </div>
    );
}
