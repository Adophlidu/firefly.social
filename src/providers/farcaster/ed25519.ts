import { getPublicKey, sign } from '@noble/ed25519';
import { bytesToHex, hexToBytes } from 'viem';

export async function getPublicKeyInHexFromPrivateKey(privateKey: string | Uint8Array) {
    try {
        const key = typeof privateKey === 'string' ? hexToBytes(privateKey as `0x${string}`) : privateKey;
        const bytes = await getPublicKey(key);
        return bytesToHex(bytes);
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error(
                `[getPublicKeyInHexFromPrivateKey] Failed to get public key from private key: ${privateKey.slice(0, 10)}`,
                error,
            );
        }
        return null;
    }
}

export async function signMessageWithPrivateKey(privateKey: string | Uint8Array, message: Uint8Array) {
    try {
        const key = typeof privateKey === 'string' ? hexToBytes(privateKey as `0x${string}`) : privateKey;
        const signature = await sign(message, key);
        return bytesToHex(signature);
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error(
                `[signMessageWithPrivateKey] Failed to sign message with private key: ${privateKey.slice(0, 10)}`,
                error,
            );
        }
        return null;
    }
}
