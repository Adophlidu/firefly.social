export function isSameAddress(address: string | undefined, otherAddress: string | undefined) {
    if (!address || !otherAddress) return false;
    return address.toLowerCase() === otherAddress.toLowerCase();
}
