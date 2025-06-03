import crypto from 'crypto';

import { env } from '@/constants/env.js';
import { FIREFLY_DEV_ROOT_URL } from '@/constants/index.js';
import { settings } from '@/settings/index.js';

export function decrypt(cipherText: string) {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(env.internal.SESSION_CIPHER_KEY, 'hex'),
        Buffer.from(env.internal.SESSION_CIPHER_IV, 'hex'),
    );
    return [decipher.update(cipherText, 'hex', 'utf-8'), decipher.final('utf-8')].join('');
}

export function encrypt(plaintext: string) {
    const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(env.internal.SESSION_CIPHER_KEY, 'hex'),
        Buffer.from(env.internal.SESSION_CIPHER_IV, 'hex'),
    );
    return [cipher.update(plaintext, 'utf-8', 'hex'), cipher.final('hex')].join('');
}

export function encryptPasscode(passcode: string) {
    const pemContent =
        settings.FIREFLY_ROOT_URL === FIREFLY_DEV_ROOT_URL
            ? env.external.NEXT_PUBLIC_PASSCODE_PUBLIC_KEY_STAGING
            : env.external.NEXT_PUBLIC_PASSCODE_PUBLIC_KEY;
    const encrypted = crypto.publicEncrypt(
        `-----BEGIN PUBLIC KEY-----\n${pemContent}\n-----END PUBLIC KEY-----`,
        Buffer.from(passcode, 'utf-8'),
    );

    return encrypted.toString('base64');
}
