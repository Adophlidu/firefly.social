import { memo } from 'react';

/**
 * A regulation score with the penalty-shootout scored-kick count as a small superscript
 * (draw 2-2, penalties 4-2 → "2⁴" / "2²"). Sizing is in em so the superscript scales to the
 * parent font; color is inherited so it reads on the highlighted winner and the dimmed loser
 * alike. Renders the bare score when there is no penalty count (or it is 0).
 */
export const SportScoreWithPenalty = memo(function SportScoreWithPenalty({
    score,
    penaltyScore,
}: {
    score: number;
    penaltyScore?: number;
}) {
    return (
        <span className="inline-flex items-start">
            {score}
            {penaltyScore ? <span className="ml-px text-[0.65em] font-bold leading-none">{penaltyScore}</span> : null}
        </span>
    );
});
