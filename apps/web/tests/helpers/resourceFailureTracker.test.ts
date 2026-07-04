import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { reportResourceFailure, shouldSkipResource } from '@/helpers/resourceFailureTracker.js';

describe('resourceFailureTracker', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('skips an exact URL only after it is reported', () => {
        const url = 'https://exact.test/a.png';
        expect(shouldSkipResource(url)).toBe(false);
        reportResourceFailure(url);
        expect(shouldSkipResource(url)).toBe(true);
    });

    it('does not trip the host below the failure threshold', () => {
        const host = 'https://below.test';
        for (let i = 0; i < 4; i += 1) reportResourceFailure(`${host}/${i}.png`);

        expect(shouldSkipResource(`${host}/fresh.png`)).toBe(false);
    });

    it('trips the host breaker after enough failures and skips other URLs from that host', () => {
        const host = 'https://storm.test';
        for (let i = 0; i < 5; i += 1) reportResourceFailure(`${host}/${i}.png`);

        expect(shouldSkipResource(`${host}/never-requested.png`)).toBe(true);
        expect(shouldSkipResource('https://other.test/x.png')).toBe(false);
    });

    it('recovers after the cooldown elapses', () => {
        const host = 'https://recover.test';
        for (let i = 0; i < 5; i += 1) reportResourceFailure(`${host}/${i}.png`);

        expect(shouldSkipResource(`${host}/probe.png`)).toBe(true);

        vi.advanceTimersByTime(30_000);
        expect(shouldSkipResource(`${host}/probe.png`)).toBe(false);
    });

    it('ignores empty/undefined input', () => {
        expect(shouldSkipResource(undefined)).toBe(false);
        expect(shouldSkipResource('')).toBe(false);
        reportResourceFailure(undefined);
        reportResourceFailure('');
        expect(shouldSkipResource('')).toBe(false);
    });
});
