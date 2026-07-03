import type { PenaltyKickOutcome } from '@/types/prediction.js';

export type PenaltyDotVariant = 'scored' | 'missed' | 'pending';

export interface PenaltyDotDescriptor {
    /** Stable per-kick index, used as the React key. */
    key: number;
    variant: PenaltyDotVariant;
}

/** Coerce a raw per-kick array into the 0|1|2 union (invalid values fall back to 0/pending). */
export function sanitizePenaltyKicks(values: readonly number[] | undefined | null): PenaltyKickOutcome[] {
    if (!values?.length) return [];
    return values.map((value) => (value === 1 || value === 2 ? value : 0));
}

export function getPenaltyDotVariant(outcome: PenaltyKickOutcome): PenaltyDotVariant {
    switch (outcome) {
        case 1:
            return 'scored';
        case 2:
            return 'missed';
        default:
            return 'pending';
    }
}

/** Build per-kick dot descriptors for one shootout side; null when there are no kicks. */
export function buildPenaltyDots(outcomes: PenaltyKickOutcome[] | undefined | null): PenaltyDotDescriptor[] | null {
    if (!outcomes?.length) return null;
    return outcomes.map((outcome, index) => ({ key: index, variant: getPenaltyDotVariant(outcome) }));
}
