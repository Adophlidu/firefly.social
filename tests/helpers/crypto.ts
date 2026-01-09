import { describe, expect, test, vi } from 'vitest';

import { decryptAes256, decryptPassword, encryptAes256, encryptPassword } from '@/services/crypto.js';

vi.mock('@/constants/env.js', () => ({
    env: {
        shared: {
            NODE_ENV: 'test',
        },
        external: {
            NEXT_PUBLIC_PASSCODE_PUBLIC_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            NEXT_PUBLIC_PASSCODE_PUBLIC_KEY_STAGING: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            NEXT_PUBLIC_PASSCODE_IV: '0123456789abcdef0123456789abcdef',
            NEXT_PUBLIC_SITE_URL: 'https://staging.firefly.social',
        },
    },
}));

const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const iv = '0123456789abcdef0123456789abcdef';

describe('crypto service', () => {
    describe('encryptAes256', () => {
        test('should encrypt plaintext successfully', () => {
            const plaintext = 'test message';

            const result = encryptAes256(plaintext, key, iv);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^[0-9a-f]+$/);
        });

        test('should encrypt empty string', () => {
            const plaintext = '';

            const result = encryptAes256(plaintext, key, iv);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^[0-9a-f]+$/);
        });
    });

    describe('decryptAes256', () => {
        test('should decrypt ciphertext successfully', () => {
            const originalPlaintext = 'test message';

            const encrypted = encryptAes256(originalPlaintext, key, iv);
            const decrypted = decryptAes256(encrypted, key, iv);

            expect(decrypted).toBe(originalPlaintext);
        });

        test('should decrypt empty string', () => {
            const originalPlaintext = '';

            const encrypted = encryptAes256(originalPlaintext, key, iv);
            const decrypted = decryptAes256(encrypted, key, iv);

            expect(decrypted).toBe(originalPlaintext);
        });

        test('should fail with wrong key', () => {
            const originalPlaintext = 'test message';

            const wrongKey = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

            const encrypted = encryptAes256(originalPlaintext, key, iv);

            expect(() => {
                decryptAes256(encrypted, wrongKey, iv);
            }).toThrow();
        });

        test('should fail with wrong IV', () => {
            const originalPlaintext = 'test message';

            const wrongIv = 'fedcba9876543210fedcba9876543210';

            const encrypted = encryptAes256(originalPlaintext, key, iv);

            expect(() => {
                decryptAes256(encrypted, key, wrongIv);
            }).toThrow();
        });
    });

    describe('encryptPassword', () => {
        test('should encrypt password successfully', () => {
            const password = '123123';
            const accountId = '1457822571';

            const result = encryptPassword(password, accountId);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result).toContain(':');

            // Verify the format: iv:encrypted
            const parts = result!.split(':');
            expect(parts).toHaveLength(2);
            expect(parts[0]).toMatch(/^[0-9a-f]{32}$/);
            expect(parts[1]).toMatch(/^[0-9a-f]+$/);
        });

        test('should return different encrypted values for same password', () => {
            const password = '123123';
            const accountId = '1457822571';

            const result1 = encryptPassword(password, accountId);
            const result2 = encryptPassword(password, accountId);

            expect(result1).not.toBe(result2);
        });

        test('should return different encrypted values for different account IDs', () => {
            const password = '123123';
            const accountId1 = '1457822571';
            const accountId2 = '1323424567';

            const result1 = encryptPassword(password, accountId1);
            const result2 = encryptPassword(password, accountId2);

            expect(result1).not.toBe(result2);
        });

        test('should handle empty password', () => {
            const password = '';
            const accountId = '1457822571';

            const result = encryptPassword(password, accountId);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result).toContain(':');
        });

        test('should handle empty account ID', () => {
            const password = '123123';
            const accountId = '';

            const result = encryptPassword(password, accountId);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result).toContain(':');
        });
    });

    describe('decryptPassword', () => {
        test('should decrypt password successfully', () => {
            const originalPassword = '123123';
            const accountId = '1457822571';

            const encrypted = encryptPassword(originalPassword, accountId);
            const decrypted = decryptPassword(encrypted!, accountId);

            expect(decrypted).toBe(originalPassword);
        });

        test('should decrypt empty password', () => {
            const originalPassword = '';
            const accountId = '1457822571';

            const encrypted = encryptPassword(originalPassword, accountId);
            const decrypted = decryptPassword(encrypted!, accountId);

            expect(decrypted).toBe(originalPassword);
        });

        test('should return null for encrypted data with empty parts', () => {
            const accountId = '1457822571';

            const result = decryptPassword(':', accountId);

            expect(result).toBeNull();
        });

        test('should return null for encrypted data with missing encrypted part', () => {
            const accountId = '1457822571';

            const result = decryptPassword('validiv:', accountId);

            expect(result).toBeNull();
        });

        test('should return null for encrypted data with missing IV', () => {
            const accountId = '1457822571';

            const result = decryptPassword(':encryptedpart', accountId);

            expect(result).toBeNull();
        });

        test('should return null when wrong account ID is used', () => {
            const originalPassword = '123123';
            const accountId1 = '1457822571';
            const accountId2 = '1323424567';

            const encrypted = encryptPassword(originalPassword, accountId1);
            const decrypted = decryptPassword(encrypted!, accountId2);

            expect(decrypted).toBeNull();
        });
    });
});
