import { describe, expect, test } from 'vitest';

import {
    areMessagesGrouped,
    countNewReceivedMessages,
    findFirstUnreadMessageIndex,
    findLatestServerMessage,
    resolveMessageDateKind,
    shouldShowMessageDateDivider,
} from '@/components/DirectMessages/messagePresentation.js';
import type { DirectMessageItem } from '@/components/DirectMessages/types.js';

function message(id: string, createdAt: string, isSelf = false): DirectMessageItem {
    return { id, createdAt, isSelf, kind: 'text', content: id, timestamp: '10:00' };
}

describe('messagePresentation', () => {
    test('groups consecutive messages from the same sender within five minutes', () => {
        const first = message('one', '2026-07-14T10:00:00.000Z');
        expect(areMessagesGrouped(first, message('two', '2026-07-14T10:04:00.000Z'))).toBe(true);
        expect(areMessagesGrouped(first, message('three', '2026-07-14T10:06:00.000Z'))).toBe(false);
        expect(areMessagesGrouped(first, message('four', '2026-07-14T10:01:00.000Z', true))).toBe(false);
    });

    test('shows a date divider when the local calendar day changes', () => {
        const first = message('one', '2026-07-13T10:00:00.000Z');
        expect(shouldShowMessageDateDivider(undefined, first)).toBe(true);
        expect(shouldShowMessageDateDivider(first, message('two', '2026-07-13T11:00:00.000Z'))).toBe(false);
        expect(shouldShowMessageDateDivider(first, message('three', '2026-07-14T10:00:00.000Z'))).toBe(true);
    });

    test('resolves today and yesterday labels', () => {
        const now = new Date('2026-07-14T12:00:00.000Z');
        expect(resolveMessageDateKind('2026-07-14T08:00:00.000Z', now)).toBe('today');
        expect(resolveMessageDateKind('2026-07-13T08:00:00.000Z', now)).toBe('yesterday');
        expect(resolveMessageDateKind('2026-07-12T08:00:00.000Z', now)).toBe('date');
    });

    test('finds the first unread message by the read marker or unread count fallback', () => {
        const messages = [message('one', '2026-07-14T10:00:00.000Z'), message('two', '2026-07-14T10:01:00.000Z')];
        expect(findFirstUnreadMessageIndex(messages, 'one', 1)).toBe(1);
        expect(findFirstUnreadMessageIndex(messages, null, 1)).toBe(1);
        expect(findFirstUnreadMessageIndex(messages, null, 0)).toBe(-1);
    });

    test('counts only newer received messages and ignores loaded history or self messages', () => {
        const messages = [
            message('history', '2026-07-14T09:59:00.000Z'),
            message('known', '2026-07-14T10:00:00.000Z'),
            message('received', '2026-07-14T10:01:00.000Z'),
            message('self', '2026-07-14T10:02:00.000Z', true),
        ];

        expect(countNewReceivedMessages(messages, new Set(['known']), new Date(messages[1].createdAt).getTime())).toBe(
            1,
        );
    });

    test('uses the latest persisted message as the read cursor', () => {
        const persisted = { id: 'persisted', is_optimistic: false };
        const optimistic = { id: 'optimistic', is_optimistic: true };

        expect(findLatestServerMessage([persisted, optimistic])).toBe(persisted);
        expect(findLatestServerMessage([optimistic])).toBeUndefined();
    });
});
