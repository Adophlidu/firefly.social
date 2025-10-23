export function toRate(num?: number | null) {
    if (num === undefined || num === null) return '-';

    return `${num < 0 ? '-' : ''}${(Math.abs(num) * 100).toFixed(2)}%`;
}
