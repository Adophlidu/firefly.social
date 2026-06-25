export interface AddressSegments {
    head: string;
    middle: string;
    tail: string;
}

/** Number of leading/trailing characters highlighted on a deposit address. */
export const DEPOSIT_ADDRESS_HIGHLIGHT_SIZE = 6;

/**
 * Split a deposit address into head/middle/tail segments so the first-6 and
 * last-6 characters can be highlighted in the UI. When the address is too short
 * to have a middle section, the whole address is returned as `head`.
 */
export function splitAddressForHighlight(address: string, size = DEPOSIT_ADDRESS_HIGHLIGHT_SIZE): AddressSegments {
    if (size <= 0 || address.length <= size * 2) {
        return { head: address, middle: '', tail: '' };
    }
    return {
        head: address.slice(0, size),
        middle: address.slice(size, -size),
        tail: address.slice(-size),
    };
}
