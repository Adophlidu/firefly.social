import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { buildPenaltyDots, type PenaltyDotVariant } from '@/helpers/prediction/penaltyShootout.js';
import type { PenaltyKickOutcome } from '@/types/prediction.js';

const DOT_VARIANT_CLASS: Record<PenaltyDotVariant, string> = {
    scored: 'bg-[#48ad3c]',
    missed: 'bg-danger',
    pending: 'bg-[#d1d1d1]',
};

interface Props {
    outcomes?: PenaltyKickOutcome[];
    className?: string;
}

/**
 * Renders one side of a penalty shootout as a row of 4px dots (4px gap):
 * green = scored, red = missed, gray = pending. Renders the full kick array
 * (growing beyond five) and renders nothing when there are no kicks yet.
 */
export const PenaltyShootoutDots = memo(function PenaltyShootoutDots({ outcomes, className }: Props) {
    const dots = buildPenaltyDots(outcomes);
    if (!dots) return null;

    return (
        <div className={classNames('flex items-center gap-1', className)} aria-hidden>
            {dots.map((dot) => (
                <span key={dot.key} className={classNames('size-1 rounded-[2px]', DOT_VARIANT_CLASS[dot.variant])} />
            ))}
        </div>
    );
});
