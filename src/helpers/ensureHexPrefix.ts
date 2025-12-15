import { type Hex } from 'viem';

/**
 * Ensures a string has the '0x' hex prefix.
 * If the string already starts with '0x', returns it as-is.
 * Otherwise, prepends '0x' to the string.
 *
 * @param value - The string to ensure has a hex prefix
 * @returns The string with '0x' prefix as Hex type
 */
export function ensureHexPrefix(value: string): Hex {
    return (value.startsWith('0x') ? value : `0x${value}`) as Hex;
}
