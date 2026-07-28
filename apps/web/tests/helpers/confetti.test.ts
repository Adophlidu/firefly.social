import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFire = vi.fn();
const mockCreate = vi.fn(() => mockFire);

vi.mock('canvas-confetti', () => ({
    default: { create: mockCreate },
}));

// Imported after the mock so the module-level `confetti.create(...)` call is captured.
const { confettiWithRealistic } = await import('@/helpers/confetti.js');

describe('confettiWithRealistic', () => {
    beforeEach(() => {
        mockFire.mockClear();
    });

    it('creates a main-thread instance without starting another worker', () => {
        expect(mockCreate).toHaveBeenCalledWith(undefined, expect.objectContaining({ useWorker: false }));
    });

    it('fires five confetti bursts', () => {
        confettiWithRealistic();
        expect(mockFire).toHaveBeenCalledTimes(5);
    });

    it('applies the default origin, a high zIndex and an integer particleCount to each burst', () => {
        confettiWithRealistic();

        for (const call of mockFire.mock.calls) {
            const options = call[0] as { origin?: { y: number }; zIndex?: number; particleCount?: number };
            expect(options.origin).toEqual({ y: 0.7 });
            expect(options.zIndex).toBe(100_000);
            expect(Number.isInteger(options.particleCount)).toBe(true);
        }
    });
});
