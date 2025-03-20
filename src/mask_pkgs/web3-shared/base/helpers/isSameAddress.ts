export function isSameAddress(address?: string | null | undefined, otherAddress?: string | null | undefined): boolean {
    if (!address || !otherAddress) return false;
    return address.toLowerCase() === otherAddress.toLowerCase();
}
