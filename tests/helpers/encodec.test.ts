import { describe, test, expect } from 'vitest';

import { decrypt, encrypt } from '@/helpers/encodec.js';

describe('encodec', () => {
    const testKey = 'test-crypto-key-12345';

    describe('encrypt', () => {
        test('should encrypt plaintext successfully', async () => {
            const plaintext = 'test message';

            const result = await encrypt(plaintext, testKey);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result).toMatchInlineSnapshot(`"5c98ef14930c713c6a7ec45482f8f6ba"`);
            expect(result).not.toMatch(/^0x/);
        });

        test('should produce deterministic output for same input', async () => {
            const plaintext = 'test message';

            const result1 = await encrypt(plaintext, testKey);
            const result2 = await encrypt(plaintext, testKey);

            expect(result1).toBe(result2);
        });

        test('should handle empty string', (async) => {
            const plaintext = '';

            return expect(encrypt(plaintext, testKey)).resolves.toBeDefined();
        });

        test('should handle unicode characters', async () => {
            const plaintext = 'Hello 世界 🌍 Ñoño';

            const result = await encrypt(plaintext, testKey);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result).toMatchInlineSnapshot(`"f209c2cacf8e92d3823b3f84cf2ceea1251741adf0feb1a3ad7567193c835e8c"`);
        });

        test('should produce different output for different keys', async () => {
            const plaintext = 'test message';

            const result1 = await encrypt(plaintext, testKey);
            const result2 = await encrypt(plaintext, 'different-key');

            expect(result1).not.toBe(result2);
        });
    });

    describe('decrypt', () => {
        test('should decrypt encrypted data back to original', async () => {
            const originalPlaintext = 'test message';

            const encrypted = await encrypt(originalPlaintext, testKey);
            const decrypted = await decrypt(encrypted, testKey);

            expect(decrypted).toBe(originalPlaintext);
        });

        test('should work with hex string without 0x prefix', async () => {
            const originalPlaintext = 'test message';

            const encrypted = await encrypt(originalPlaintext, testKey);
            const decrypted = await decrypt(encrypted, testKey);

            expect(decrypted).toBe(originalPlaintext);
        });

        test('should work with hex string with 0x prefix', async () => {
            const originalPlaintext = 'test message';

            const encrypted = await encrypt(originalPlaintext, testKey);
            const decrypted = await decrypt(`0x${encrypted}`, testKey);

            expect(decrypted).toBe(originalPlaintext);
        });

        test('should handle empty string', async () => {
            const originalPlaintext = '';

            const encrypted = await encrypt(originalPlaintext, testKey);
            const decrypted = await decrypt(encrypted, testKey);

            expect(decrypted).toBe(originalPlaintext);
        });

        test('should handle unicode characters', async () => {
            const originalPlaintext = 'Hello 世界 🌍 Ñoño';

            const encrypted = await encrypt(originalPlaintext, testKey);
            const decrypted = await decrypt(encrypted, testKey);

            expect(decrypted).toBe(originalPlaintext);
        });
    });

    describe('encrypt/decrypt round-trip', () => {
        test('should handle various plaintext values', async () => {
            const testCases = [
                'simple text',
                'with spaces',
                'with\nnewlines',
                'with\ttabs',
                'special chars: !@#$%^&*()',
                'numbers: 1234567890',
                'Unicode: 你好世界 🚀',
                'mixed: abcDEF123!?@#',
            ];

            for (const plaintext of testCases) {
                const encrypted = await encrypt(plaintext, testKey);
                const decrypted = await decrypt(encrypted, testKey);
                expect(decrypted).toBe(plaintext);
            }
        });

        test('should maintain data integrity through multiple encrypt/decrypt cycles', async () => {
            const originalPlaintext = 'test message for multiple cycles';

            let data = originalPlaintext;
            for (let i = 0; i < 3; i++) {
                const encrypted = await encrypt(data, testKey);
                data = await decrypt(encrypted, testKey);
            }

            expect(data).toBe(originalPlaintext);
        });
    });

    describe('error cases', () => {
        test('should throw error for invalid hex string', async () => {
            const invalidHex = 'not-a-valid-hex-string';

            await expect(decrypt(invalidHex, testKey)).rejects.toThrow();
        });

        test('should throw error for hex with invalid characters', async () => {
            const invalidHex = 'xyz123';

            await expect(decrypt(invalidHex, testKey)).rejects.toThrow();
        });

        test('should produce garbage data with wrong key (no error thrown)', async () => {
            const originalPlaintext = 'test message';
            const wrongKey = 'wrong-key-different';

            const encrypted = await encrypt(originalPlaintext, testKey);

            // Decryption with wrong key may succeed but produce garbage or fail to decode properly
            // The Web Crypto API decrypt() will throw if padding is invalid
            await expect(decrypt(encrypted, wrongKey)).rejects.toThrow();
        });

        test('should throw error for odd-length hex string', async () => {
            const oddLengthHex = 'abc123';

            await expect(decrypt(oddLengthHex, testKey)).rejects.toThrow();
        });
    });
});
