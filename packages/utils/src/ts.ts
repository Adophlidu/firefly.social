export function isMilliseconds(ts: string) {
    return ts.length === 13 && /^\d+$/.test(ts);
}

export function isUnix(ts: string): boolean {
    return /^\d+$/.test(ts) && ts.length === 10;
}
