import { NODE_ENV } from '@dimensiondev/enums';
import { getPublicKey, sign } from '@noble/ed25519';
import { bytesToHex, hexToBytes } from 'viem';

import { logger } from '@/libs/Logger.js';

export async function getPublicKeyInHexFromPrivateKey(privateKey: string | Uint8Array) {
    try {
        const key = typeof privateKey === 'string' ? hexToBytes(privateKey as `0x${string}`) : privateKey;
        const bytes = await getPublicKey(key);
        return bytesToHex(bytes);
    } catch (error) {
        if (process.env.NODE_ENV === NODE_ENV.Development) {
            logger.error(
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
        return sign(message, key);
    } catch (error) {
        if (process.env.NODE_ENV === NODE_ENV.Development) {
            logger.error(
                `[signMessageWithPrivateKey] Failed to sign message with private key: ${privateKey.slice(0, 10)}`,
                error,
            );
        }
        return null;
    }
}
