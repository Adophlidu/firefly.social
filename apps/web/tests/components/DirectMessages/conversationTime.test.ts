import { describe, expect, test } from 'vitest';

import { getConversationTimeRefreshInterval } from '@/components/DirectMessages/conversationTime.js';

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOW = Date.parse('2026-07-21T12:00:00.000Z');

function getTimestamp(age: number) {
    return new Date(NOW - age).toISOString();
}

describe('getConversationTimeRefreshInterval', () => {
    test('refreshes relative times using their current display granularity', () => {
        expect(getConversationTimeRefreshInterval(getTimestamp(4 * SECOND), NOW)).toBe(SECOND);
        expect(getConversationTimeRefreshInterval(getTimestamp(MINUTE), NOW)).toBe(MINUTE);
        expect(getConversationTimeRefreshInterval(getTimestamp(HOUR), NOW)).toBe(HOUR);
        expect(getConversationTimeRefreshInterval(getTimestamp(DAY), NOW)).toBe(DAY);
    });

    test('changes the refresh interval at each relative-time boundary', () => {
        expect(getConversationTimeRefreshInterval(getTimestamp(MINUTE - 1), NOW)).toBe(SECOND);
        expect(getConversationTimeRefreshInterval(getTimestamp(HOUR - 1), NOW)).toBe(MINUTE);
        expect(getConversationTimeRefreshInterval(getTimestamp(DAY - 1), NOW)).toBe(HOUR);
    });

    test('does not start a timer without a valid message timestamp', () => {
        expect(getConversationTimeRefreshInterval(null, NOW)).toBeNull();
        expect(getConversationTimeRefreshInterval('invalid', NOW)).toBeNull();
    });
});
