import { describe, expect, it } from 'vitest';

import { formatSecondsToHours } from '@/helpers/formatSeconds.js';

describe('formatSecondsToHours', () => {
    it('should return `0:00`', () => {
        expect(formatSecondsToHours(0)).toBe('0:00');
    });

    it('should return `0:00`', () => {
        expect(formatSecondsToHours(-1)).toBe('0:00');
    });

    it('should return `0:01`', () => {
        expect(formatSecondsToHours(1)).toBe('0:01');
    });

    it('should return `0:59`', () => {
        expect(formatSecondsToHours(59)).toBe('0:59');
    });

    it('should return `1:00`', () => {
        expect(formatSecondsToHours(60)).toBe('1:00');
    });

    it('should return `1:01`', () => {
        expect(formatSecondsToHours(61)).toBe('1:01');
    });

    it('should return `10:00`', () => {
        expect(formatSecondsToHours(600)).toBe('10:00');
    });

    it('should return `1:00:00`', () => {
        expect(formatSecondsToHours(3600)).toBe('1:00:00');
    });
});
