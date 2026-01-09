import { describe, expect, it } from 'vitest';

import { type SocialSource, Source } from '@/constants/enum.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { type ProfileLike } from '@/providers/types/SocialMedia.js';

describe('isSameProfile (Integration)', () => {
    const sourceA: SocialSource = Source.Farcaster;
    const sourceB: SocialSource = Source.Lens;

    const addrLower = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
    const addrChecksum = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const addrDifferent = '0x1234567890123456789012345678901234567890';

    const baseProfile: ProfileLike = {
        source: sourceA,
        profileId: '',
        handle: 'user',
    };

    describe('Edge Cases', () => {
        it('should return false if any profile is null/undefined', () => {
            expect(isSameProfile(null, baseProfile)).toBe(false);
            expect(isSameProfile(baseProfile, undefined)).toBe(false);
            expect(isSameProfile(null, undefined)).toBe(false);
        });
    });

    describe('Source Check', () => {
        it('should return false if sources differ', () => {
            const p1 = { ...baseProfile, source: sourceA, profileId: addrLower };
            const p2 = { ...baseProfile, source: sourceB, profileId: addrLower };
            expect(isSameProfile(p1, p2)).toBe(false);
        });
    });

    describe('String Equality', () => {
        it('should return true for identical simple IDs', () => {
            const p1 = { ...baseProfile, profileId: '12345' };
            const p2 = { ...baseProfile, profileId: '12345' };
            expect(isSameProfile(p1, p2)).toBe(true);
        });
    });

    describe('EVM Address Logic (Real viem implementation)', () => {
        it('should verify same address with different casing (Checksum support)', () => {
            const p1 = { ...baseProfile, profileId: addrLower };
            const p2 = { ...baseProfile, profileId: addrChecksum };

            expect(isSameProfile(p1, p2)).toBe(true);
        });

        it('should return false for distinct addresses', () => {
            const p1 = { ...baseProfile, profileId: addrLower };
            const p2 = { ...baseProfile, profileId: addrDifferent };

            expect(isSameProfile(p1, p2)).toBe(false);
        });
    });

    describe('Non-EVM ID Mismatch', () => {
        it('should return false for different non-address IDs', () => {
            const p1 = { ...baseProfile, profileId: '0x01' };
            const p2 = { ...baseProfile, profileId: '0x02' };

            expect(isSameProfile(p1, p2)).toBe(false);
        });
    });
});
