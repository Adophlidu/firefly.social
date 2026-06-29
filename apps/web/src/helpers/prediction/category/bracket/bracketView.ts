import type { BracketColumnId } from '@/helpers/prediction/category/bracket/types.js';

export const ROUND_SEQUENCE: BracketColumnId[] = ['r32', 'r16', 'qf', 'sf', 'final', 'champion'];

/** Window shows the selected column plus the column it feeds into. The last two columns clamp to final→champion. */
export function resolveRoundWindow(selected: BracketColumnId): {
    left: BracketColumnId;
    right: BracketColumnId;
} {
    const index = ROUND_SEQUENCE.indexOf(selected);
    const leftIndex = Math.min(Math.max(index, 0), ROUND_SEQUENCE.length - 2);
    return { left: ROUND_SEQUENCE[leftIndex], right: ROUND_SEQUENCE[leftIndex + 1] };
}
