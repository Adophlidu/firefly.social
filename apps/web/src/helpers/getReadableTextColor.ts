/**
 * Picks a readable text color (black or white) for the given background by computing
 * its perceived grayscale value (ITU-R BT.601 luma) and falling back to white.
 *
 * Used for overlays/badges filled with an arbitrary team national color, where a fixed
 * text color would be illegible on light vs. dark backgrounds.
 */
export function getReadableTextColor(hex: string): string {
    let normalized = hex.replace('#', '').trim();
    if (normalized.length === 3) {
        normalized = normalized
            .split('')
            .map((c) => c + c)
            .join('');
    }
    if (normalized.length !== 6) return '#ffffff';

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '#ffffff';

    const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luma >= 0.5 ? '#000000' : '#ffffff';
}
