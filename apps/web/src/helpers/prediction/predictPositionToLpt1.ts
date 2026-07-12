import type { Lpt1PositionInput } from '@/helpers/lpt1.js';
import type { PredictionPositionDataForUI } from '@/types/prediction.js';

/**
 * Size signal for picking the largest holding. `current_value` is the
 * runtime-computed `cur_price × shares` field on the UI position; when it is
 * absent we derive the same product from `shares × cur_price`. (The plan's
 * third `?? shares` tier never triggers because `shares × cur_price` is always
 * a number, so it is omitted.)
 */
function positionSizeKey(p: PredictionPositionDataForUI): number {
    return p.current_value ?? p.shares * p.cur_price;
}

/**
 * Pick the author's largest holding in an event. Drops dust positions
 * (`shares < 0.01`, mirroring `MarketsCurrentPositions`), then takes the max
 * by `current_value ?? shares × cur_price`; the first position wins on ties.
 * Returns `null` for an empty (or all-dust) list.
 */
export function pickLargestPosition(positions: PredictionPositionDataForUI[]): PredictionPositionDataForUI | null {
    let best: PredictionPositionDataForUI | null = null;
    let bestKey = -Infinity;
    for (const p of positions) {
        if (p.shares < 0.01) continue; // drop dust (mirrors MarketsCurrentPositions)
        const key = positionSizeKey(p);
        if (!best || key > bestKey) {
            best = p;
            bestKey = key;
        }
    }
    return best;
}

/**
 * Map a UI position onto the LPT-1 position input emitted with an Orb comment.
 * `vote_status` is the outcome label (team code, "Yes", "Over", …), `avg_price`
 * is the 0–1 entry-price fraction (`$value = shares × price` = cost basis), and
 * `outcomeIndex` defaults to 0 when the feed omits it. `marketId` is left
 * undefined: the Polymarket numeric market id is not on the position type, and
 * `conditionId` is the consumer's market-lookup key.
 */
export function mapPositionToLpt1Input(p: PredictionPositionDataForUI): Lpt1PositionInput {
    return {
        conditionId: p.conditionId,
        outcome: p.vote_status,
        outcomeIndex: p.outcomeIndex ?? 0,
        shares: p.shares,
        price: p.avg_price,
    };
}
