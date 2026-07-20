import { describe, expect, test } from 'vitest';

import {
    clearViewedConversationUnread,
    isConversationVisibleInTab,
    resolveAdjacentConversationIndex,
    resolveConversationState,
    retainConversationForTab,
} from '@/components/DirectMessages/conversationNavigation.js';
import type { DirectMessageConversation } from '@/components/DirectMessages/types.js';

function createConversation(
    id: string,
    options: Pick<DirectMessageConversation, 'unreadCount' | 'isRequest'> = {
        unreadCount: 0,
        isRequest: false,
    },
): DirectMessageConversation {
    return {
        id,
        targetUserId: id,
        name: id,
        handle: id,
        initials: id,
        preview: '',
        timestamp: '',
        lastReadMessageId: null,
        ...options,
    };
}

describe('resolveAdjacentConversationIndex', () => {
    test('selects the first or last conversation when none is active', () => {
        expect(resolveAdjacentConversationIndex(-1, 3, 1)).toBe(0);
        expect(resolveAdjacentConversationIndex(-1, 3, -1)).toBe(2);
    });

    test('wraps keyboard navigation at both ends', () => {
        expect(resolveAdjacentConversationIndex(2, 3, 1)).toBe(0);
        expect(resolveAdjacentConversationIndex(0, 3, -1)).toBe(2);
    });
});

describe('retainConversationForTab', () => {
    test('keeps an active unread conversation after it leaves the query result', () => {
        const conversation = createConversation('selected', { unreadCount: 2, isRequest: false });

        expect(retainConversationForTab([], { conversation, tab: 'unread' }, 'unread')).toEqual([
            { ...conversation, unreadCount: 0 },
        ]);
    });

    test('keeps an accepted request only while its original tab remains selected', () => {
        const conversation = createConversation('request', { unreadCount: 0, isRequest: true });
        const retainedConversation = { conversation, tab: 'requests' } as const;

        expect(retainConversationForTab([], retainedConversation, 'requests')).toEqual([
            { ...conversation, isRequest: false },
        ]);
        expect(retainConversationForTab([], retainedConversation, 'all')).toEqual([]);
    });
});

describe('resolveConversationState', () => {
    test('uses a restored conversation only for the thread while the complete channel list loads', () => {
        const restoredConversation = { conversation: createConversation('selected'), tab: 'all' as const };
        const conversations = [
            createConversation('first'),
            createConversation('selected'),
            createConversation('third'),
        ];

        expect(
            resolveConversationState({
                activeConversationId: 'selected',
                conversations: [],
                restoredConversation,
                retainedConversation: undefined,
                selectedTab: 'all',
            }),
        ).toEqual({
            activeConversation: restoredConversation.conversation,
            displayedConversations: [],
        });

        expect(
            resolveConversationState({
                activeConversationId: 'selected',
                conversations,
                restoredConversation,
                retainedConversation: undefined,
                selectedTab: 'all',
            }),
        ).toEqual({
            activeConversation: conversations[1],
            displayedConversations: conversations,
        });
    });
});

describe('isConversationVisibleInTab', () => {
    test('keeps the active conversation visible after its state changes', () => {
        const readConversation = createConversation('selected', { unreadCount: 0, isRequest: false });
        const acceptedRequest = createConversation('request', { unreadCount: 0, isRequest: false });

        expect(isConversationVisibleInTab(readConversation, 'unread', 'selected')).toBe(true);
        expect(isConversationVisibleInTab(acceptedRequest, 'requests', 'request')).toBe(true);
    });

    test('continues to filter inactive conversations by their current state', () => {
        const readConversation = createConversation('read', { unreadCount: 0, isRequest: false });
        const acceptedRequest = createConversation('accepted', { unreadCount: 0, isRequest: false });

        expect(isConversationVisibleInTab(readConversation, 'unread', 'selected')).toBe(false);
        expect(isConversationVisibleInTab(acceptedRequest, 'requests', 'request')).toBe(false);
    });
});

describe('clearViewedConversationUnread', () => {
    test('clears unread state for the conversation currently displayed on desktop', () => {
        const viewedConversation = createConversation('first', { unreadCount: 2, isRequest: false });
        const otherConversation = createConversation('second', { unreadCount: 3, isRequest: false });

        expect(clearViewedConversationUnread([viewedConversation, otherConversation], 'first')).toEqual([
            { ...viewedConversation, unreadCount: 0 },
            otherConversation,
        ]);
    });

    test('preserves unread state while no conversation is being viewed', () => {
        const conversation = createConversation('first', { unreadCount: 2, isRequest: false });

        expect(clearViewedConversationUnread([conversation], undefined)).toEqual([conversation]);
    });
});
