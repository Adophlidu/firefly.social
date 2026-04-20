import { hexToBytes, toHex } from 'viem';

import { ensureHexPrefix } from '@dimensiondev/web3/utils';

const APP_LOGIN_ENCRYPT_IV = '0x4f05c37c16c801c2516b0338a8fd0cf9';

/**
 * Encrypt plaintext using AES-CBC encryption.
 *
 * @param plainText - The text to encrypt
 * @param cryptoKey - The key to derive AES key from using SHA-256
 * @returns Hex string without 0x prefix
 */
export async function encrypt(plainText: string, cryptoKey: string): Promise<string> {
    const iv = hexToBytes(APP_LOGIN_ENCRYPT_IV) as Uint8Array<ArrayBuffer>;

    const cryptoBytes = new TextEncoder().encode(cryptoKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', cryptoBytes);
    const aesKey = await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-CBC' }, false, ['encrypt']);

    const plainBytes = new TextEncoder().encode(plainText);
    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-CBC',
            iv,
        },
        aesKey,
        plainBytes,
    );

    return toHex(new Uint8Array(encryptedBuffer)).slice(2);
}

/**
 * Decrypt data that was encrypted with the encrypt function.
 *
 * @param data - Hex string (with or without 0x prefix) to decrypt
 * @param cryptoKey - The OTP/Key to derive AES key from using SHA-256
 * @returns Decrypted plaintext string
 */
export async function decrypt(data: string, cryptoKey: string): Promise<string> {
    const iv = hexToBytes(APP_LOGIN_ENCRYPT_IV) as Uint8Array<ArrayBuffer>;
    const encryptedData = hexToBytes(ensureHexPrefix(data)) as Uint8Array<ArrayBuffer>;

    // Derive AES key using SHA-256 hash of OTP
    const otpBytes = new TextEncoder().encode(cryptoKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', otpBytes);
    const aesKey = await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-CBC' }, false, ['decrypt']);

    // Decrypt using AES-CBC
    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: 'AES-CBC',
            iv,
        },
        aesKey,
        encryptedData,
    );

    return new TextDecoder().decode(decryptedBuffer);
}
