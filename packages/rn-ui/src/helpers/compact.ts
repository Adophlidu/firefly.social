export function compact<T>(arr: Array<T | null | undefined>): T[] {
    return arr.filter((item): item is T => item !== null && item !== undefined);
}
