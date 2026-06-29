/**
 * Orthogonal (horizontal -> vertical -> horizontal) connector path between two card anchors,
 * with rounded 90° corners. Used by the knockout bracket to link a match card to the next-round
 * card it feeds into.
 *
 * @param sx, sy  start anchor (right edge, vertical center of the source card)
 * @param px, py  end anchor (left edge, vertical center of the target card); px > sx
 * @param radius  desired corner roundness; auto-clamped so corners never overlap
 */
export function buildConnectorPath(sx: number, sy: number, px: number, py: number, radius: number): string {
    const midX = (sx + px) / 2;
    const dy = py - sy;

    // Cards aligned on the same horizontal axis -> straight line, no turns to round.
    if (Math.abs(dy) < 0.5) return `M ${sx} ${sy} L ${px} ${py}`;

    const sign = dy > 0 ? 1 : -1;
    // Clamp so each corner fits inside its adjacent straight segment and the two corners never
    // overlap (the vertical leg must stay at least 2r tall).
    const maxR = Math.min(midX - sx, px - midX, Math.abs(dy) / 2);
    const r = Math.max(0, Math.min(radius, maxR));

    // Tiny hop -> no room to round, fall back to the sharp stair-step.
    if (r < 0.5) return `M ${sx} ${sy} H ${midX} V ${py} H ${px}`;

    return [
        `M ${sx} ${sy}`,
        `L ${midX - r} ${sy}`,
        `Q ${midX} ${sy} ${midX} ${sy + sign * r}`,
        `L ${midX} ${py - sign * r}`,
        `Q ${midX} ${py} ${midX + r} ${py}`,
        `L ${px} ${py}`,
    ].join(' ');
}
