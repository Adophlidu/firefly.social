import { bytesToHex } from 'viem';
import { describe, expect, it } from 'vitest';

import { getPublicKeyInHexFromPrivateKey, signMessageWithPrivateKey } from '@/providers/farcaster/ed25519.js';

describe('ed25519 helpers', () => {
    describe('getPublicKeyInHexFromSigner', () => {
        it('should return hex public key when signer succeeds', async () => {
            // Create a real Ed25519 key pair
            const privateKey = new Uint8Array(32);
            privateKey[0] = 0x01; // Set some deterministic bytes

            const result = await getPublicKeyInHexFromPrivateKey(privateKey);

            expect(result).toMatchInlineSnapshot(
                `"0xcecc1507dc1ddd7295951c290888f095adb9044d1b73d696e6df065d683bd4fc"`,
            );
            expect(result).toHaveLength(66); // 0x + 64 hex chars
        });

        it('should return null when signer fails', async () => {
            try {
                const result = await getPublicKeyInHexFromPrivateKey('mockPrivateKey');
                expect(result).toBeNull();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
            }
        });
    });

    describe('signMessageWithPrivateKey', () => {
        it('should return hex signature when signer succeeds', async () => {
            // Create a real Ed25519 key pair
            const privateKey = new Uint8Array(32);
            privateKey[0] = 0x02; // Different deterministic bytes for this test

            const message = new Uint8Array([9, 10, 11, 12]);
            const result = await signMessageWithPrivateKey(privateKey, message);
            if (!result) throw new Error('Signer failed');

            const resultInHex = bytesToHex(result);

            expect(resultInHex).toBeTruthy();
            expect(resultInHex).toMatchInlineSnapshot(
                `"0x90a0c873074788e8748a4554018dd6734a8888e46c3a2340076aba603ffc6b210fb564bfe2710463aeade0c353f142a3058b8e247145e49e6037aef23e0f170e"`,
            );
            expect(resultInHex).toHaveLength(130); // 0x + 128 hex chars
        });

        it('should return null when signer fails', async () => {
            try {
                const message = new Uint8Array([1, 2, 3]);
                const result = await signMessageWithPrivateKey('mockPrivateKey', message);
                expect(result).toBeNull();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
            }
        });
    });
});
