import type { PredictionPositionDataForUI } from '@/types/prediction.js';

/**
 * Finds the position that corresponds to a timeline bet activity. A Polymarket market outcome is
 * uniquely identified by `(conditionId, outcomeIndex)` — the same market carries one position per
 * outcome (e.g. Yes / No), so both must match. `conditionId` is compared case-insensitively (hex).
 * Returns null when no position matches (e.g. the holding was fully redeemed and paged out).
 */
export function findMatchingPosition(
    positions: PredictionPositionDataForUI[],
    conditionId: string,
    outcomeIndex: number,
): PredictionPositionDataForUI | null {
    if (!conditionId) return null;
    const target = conditionId.toLowerCase();

    return (
        positions.find(
            (position) => position.conditionId?.toLowerCase() === target && position.outcomeIndex === outcomeIndex,
        ) ?? null
    );
}
