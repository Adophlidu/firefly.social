/// @vitest-environment jsdom

import { beforeEach, describe, expect, test } from 'vitest';

import {
    clearDmTargetIntent,
    getDmRetainedConversation,
    replaceDmConversationInUrl,
    replaceDmInboxTabInUrl,
} from '@/components/DirectMessages/dmTargetIntent.js';

describe('clearDmTargetIntent', () => {
    beforeEach(() => {
        window.history.replaceState({ preserved: true }, '', '/messages?to=0x1234&tab=unread&channel=channel-1#latest');
    });

    test('removes only the target user without navigating away from the current page', () => {
        clearDmTargetIntent();

        expect(window.location.pathname).toBe('/messages');
        expect(window.location.search).toBe('?tab=unread&channel=channel-1');
        expect(window.location.hash).toBe('#latest');
        expect(window.history.state).toEqual({ preserved: true });
    });
});

describe('replaceDmConversationInUrl', () => {
    beforeEach(() => {
        window.history.replaceState({ preserved: true }, '', '/messages?tab=unread#latest');
    });

    test('persists the selected channel without adding a history entry', () => {
        replaceDmConversationInUrl('channel-1');

        expect(window.location.search).toBe('?tab=unread&channel=channel-1');
        expect(window.location.hash).toBe('#latest');
        expect(window.history.state).toEqual({ preserved: true });
    });

    test('removes the selected channel while preserving other URL state', () => {
        replaceDmConversationInUrl('channel-1');
        replaceDmConversationInUrl();

        expect(window.location.search).toBe('?tab=unread');
        expect(window.location.hash).toBe('#latest');
    });

    test('restores a selected conversation only for its account and channel', () => {
        const retainedConversation = {
            conversation: {
                id: 'channel-1',
                targetUserId: 'user-1',
                name: 'Alice',
                handle: 'alice',
                initials: 'A',
                preview: 'Hello',
                timestamp: 'now',
                unreadCount: 0,
                lastReadMessageId: null,
            },
            tab: 'unread' as const,
        };
        replaceDmConversationInUrl('channel-1', { account: '0xAccount', retainedConversation });

        expect(getDmRetainedConversation('0xaccount', 'channel-1')).toEqual(retainedConversation);
        expect(getDmRetainedConversation('0xother', 'channel-1')).toBeUndefined();
        expect(getDmRetainedConversation('0xaccount', 'channel-2')).toBeUndefined();
    });
});

describe('replaceDmInboxTabInUrl', () => {
    test('persists filtered tabs and removes the default tab', () => {
        window.history.replaceState({ preserved: true }, '', '/messages?channel=channel-1');

        replaceDmInboxTabInUrl('requests');
        expect(window.location.search).toBe('?channel=channel-1&tab=requests');

        replaceDmInboxTabInUrl('all');
        expect(window.location.search).toBe('?channel=channel-1');
        expect(window.history.state).toEqual({ preserved: true });
    });
});
