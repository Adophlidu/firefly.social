import type { Hex } from 'viem';

/**
 * Ensures a string has the '0x' hex prefix.
 * If the string already starts with '0x', returns it as-is.
 * Otherwise, prepends '0x' to the string.
 */
export function ensureHexPrefix(value: string): Hex {
    return (value.startsWith('0x') ? value : `0x${value}`) as Hex;
}
