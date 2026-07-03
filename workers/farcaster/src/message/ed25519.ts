import { getPublicKey, sign } from '@noble/ed25519';
import { bytesToHex, hexToBytes } from 'viem';

export async function getPublicKeyInHexFromPrivateKey(privateKey: string | Uint8Array) {
    try {
        // Lazy-load the crypto functions to avoid global scope initialization
        const key = typeof privateKey === 'string' ? hexToBytes(privateKey as `0x${string}`) : privateKey;
        const bytes = await getPublicKey(key);
        return bytesToHex(bytes);
    } catch (error) {
        console.error(
            `[getPublicKeyInHexFromPrivateKey] Failed to get public key from private key: ${typeof privateKey === 'string' ? privateKey.slice(0, 10) : '...'}`,
            error,
        );
        return null;
    }
}

export async function signMessageWithPrivateKey(privateKey: string | Uint8Array, message: Uint8Array) {
    try {
        // Lazy-load the crypto functions to avoid global scope initialization
        const key = typeof privateKey === 'string' ? hexToBytes(privateKey as `0x${string}`) : privateKey;
        return sign(message, key);
    } catch (error) {
        console.error(
            `[signMessageWithPrivateKey] Failed to sign message with private key: ${typeof privateKey === 'string' ? privateKey.slice(0, 10) : '...'}`,
            error,
        );
        return null;
    }
}
