export function isNumericalProfileId(id: string): boolean {
    return /^\d+$/.test(id);
}
