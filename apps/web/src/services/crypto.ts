import { envs, NODE_ENV } from '@dimensiondev/envs';
import crypto from 'crypto';

import { FIREFLY_ROOT_URL_DEV } from '@/constants/static.js';
import { logger } from '@/libs/Logger.js';
import { settings } from '@/settings/index.js';

export function decryptAes256(cipherText: string, key: string, iv: string) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    return [decipher.update(cipherText, 'hex', 'utf-8'), decipher.final('utf-8')].join('');
}

export function encryptAes256(plaintext: string, key: string, iv: string) {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    return [cipher.update(plaintext, 'utf-8', 'hex'), cipher.final('hex')].join('');
}

export function encryptPasscode(passcode: string) {
    const pemContent =
        settings.FIREFLY_ROOT_URL === FIREFLY_ROOT_URL_DEV
            ? envs.external.NEXT_PUBLIC_PASSCODE_PUBLIC_KEY_STAGING
            : envs.external.NEXT_PUBLIC_PASSCODE_PUBLIC_KEY;

    const encrypted = crypto.publicEncrypt(
        `-----BEGIN PUBLIC KEY-----\n${pemContent}\n-----END PUBLIC KEY-----`,
        Buffer.from(passcode, 'utf-8'),
    );
    return encrypted.toString('base64');
}

export function encryptPassword(password: string, accountId: string) {
    try {
        const key = crypto.createHash('sha256').update(accountId).digest('hex');
        const iv = crypto.randomBytes(16).toString('hex');
        const encrypted = encryptAes256(password, key, iv);
        return iv + ':' + encrypted;
    } catch (error) {
        if (envs.shared.NODE_ENV === NODE_ENV.Development) logger.error('Encryption failed:', error);
        return null;
    }
}

export function decryptPassword(encryptedData: string, accountId: string): string | null {
    try {
        const [iv, encrypted] = encryptedData.split(':');
        if (!iv || !encrypted) return null;

        const key = crypto.createHash('sha256').update(accountId).digest('hex');
        return decryptAes256(encrypted, key, iv);
    } catch (error) {
        if (envs.shared.NODE_ENV === NODE_ENV.Development) logger.error('Decryption failed:', error);
        return null;
    }
}
