import webCrypto from 'crypto';

import type { FireflySession } from '@/providers/firefly/Session.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export function encryptPassword(password: string) {
    try {
        const fireflySession = useFireflyStateStore.getState().currentProfileSession as FireflySession | null;
        const accountId = fireflySession?.profileId;
        if (!accountId) return;

        const key = webCrypto.createHash('sha256').update(accountId).digest();
        const iv = webCrypto.randomBytes(16);
        const cipher = webCrypto.createCipheriv('aes-256-cbc', key, iv);

        let encrypted = cipher.update(password, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Encryption failed:', error);
        return null;
    }
}

export function decryptPassword(encryptedData: string): string | null {
    try {
        const [ivString, encrypted] = encryptedData.split(':');
        if (!ivString || !encrypted) return null;

        const fireflySession = useFireflyStateStore.getState().currentProfileSession as FireflySession | null;
        const accountId = fireflySession?.profileId;
        if (!accountId) return null;

        const iv = Buffer.from(ivString, 'hex');
        const key = webCrypto.createHash('sha256').update(accountId).digest();
        const decipher = webCrypto.createDecipheriv('aes-256-cbc', key, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch {
        return null;
    }
}
