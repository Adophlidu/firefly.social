/** Bitcoin base58 alphabet (also used by Solana). Excludes 0, O, I and l. */
// cspell:disable-next-line
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Decode a base58 string, matching the semantics of the `bs58` decoder used by
 * `@solana/web3.js` — without pulling `@coral-xyz/anchor` (and the `@solana/web3.js`
 * it drags along, ~475KB raw) into the eager client bundle.
 *
 * Returns `null` when the input contains a non-base58 character (where `bs58` throws).
 * An empty string decodes to an empty array, like `bs58`.
 */
export function decodeBase58(value: string): Uint8Array | null {
    let num = 0n;
    let leadingZeros = 0;
    let countingZeros = true;
    for (const char of value) {
        const digit = BASE58_ALPHABET.indexOf(char);
        if (digit === -1) return null;
        if (countingZeros && digit === 0) leadingZeros += 1;
        else countingZeros = false;
        num = num * 58n + BigInt(digit);
    }

    const bytes: number[] = [];
    while (num > 0n) {
        // Arithmetic byte extraction (BigInt division truncates), equivalent to
        // `& 0xffn` / `>>= 8n`, which the no-bitwise lint rule forbids.
        bytes.push(Number(num % 256n));
        num /= 256n;
    }
    bytes.reverse();

    const result = new Uint8Array(leadingZeros + bytes.length);
    result.set(bytes, leadingZeros);
    return result;
}
