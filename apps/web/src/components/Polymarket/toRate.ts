export function toRate(num?: number | null) {
    if (num === undefined || num === null) return '-';

    const clamped = Math.max(-1, num);
    return `${clamped < 0 ? '-' : ''}${(Math.abs(clamped) * 100).toFixed(2)}%`;
}
