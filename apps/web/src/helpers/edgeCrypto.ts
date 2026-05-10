function fromHex(hex: string): Uint8Array<ArrayBuffer> {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    const buf = new ArrayBuffer(clean.length / 2);
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
    }

    return bytes;
}

/**
 * AES-256-CBC decryption using the Web Crypto API (Edge-compatible).
 * Drop-in async replacement for decryptAes256 from @/services/crypto.
 *
 * @param cipherText - Hex-encoded ciphertext
 * @param key        - Hex-encoded 32-byte key
 * @param iv         - Hex-encoded 16-byte IV
 */
export async function decryptAes256Edge(cipherText: string, key: string, iv: string): Promise<string> {
    const keyBytes = fromHex(key);
    const ivBytes = fromHex(iv);
    const cipherBytes = fromHex(cipherText);

    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['decrypt']);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: ivBytes }, cryptoKey, cipherBytes);

    return new TextDecoder().decode(decryptedBuffer);
}
