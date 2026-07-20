import type { DirectMessageConversation, InboxTab } from '@/components/DirectMessages/types.js';

export interface RetainedConversation {
    conversation: DirectMessageConversation;
    tab: InboxTab;
}

interface ResolveConversationStateOptions {
    activeConversationId: string | undefined;
    conversations: DirectMessageConversation[];
    restoredConversation: RetainedConversation | undefined;
    retainedConversation: RetainedConversation | undefined;
    selectedTab: InboxTab;
}

export function resolveAdjacentConversationIndex(currentIndex: number, conversationCount: number, direction: 1 | -1) {
    if (!conversationCount) return -1;
    if (currentIndex < 0) return direction > 0 ? 0 : conversationCount - 1;
    return (currentIndex + direction + conversationCount) % conversationCount;
}

export function retainConversationForTab(
    conversations: DirectMessageConversation[],
    retainedConversation: RetainedConversation | undefined,
    selectedTab: InboxTab,
) {
    if (retainedConversation?.tab !== selectedTab) return conversations;
    if (conversations.some((conversation) => conversation.id === retainedConversation.conversation.id)) {
        return conversations;
    }

    const conversation =
        selectedTab === 'unread'
            ? { ...retainedConversation.conversation, unreadCount: 0 }
            : { ...retainedConversation.conversation, isRequest: false };
    return [conversation, ...conversations];
}

export function clearViewedConversationUnread(
    conversations: DirectMessageConversation[],
    viewedConversationId: string | undefined,
) {
    if (!viewedConversationId) return conversations;
    return conversations.map((conversation) =>
        conversation.id === viewedConversationId ? { ...conversation, unreadCount: 0 } : conversation,
    );
}

export function resolveConversationState({
    activeConversationId,
    conversations,
    restoredConversation,
    retainedConversation,
    selectedTab,
}: ResolveConversationStateOptions) {
    const queriedActiveConversation = conversations.find((conversation) => conversation.id === activeConversationId);
    const retainedActiveConversation =
        retainedConversation?.conversation.id === activeConversationId ? retainedConversation?.conversation : undefined;
    const restoredActiveConversation =
        restoredConversation?.conversation.id === activeConversationId ? restoredConversation?.conversation : undefined;

    return {
        activeConversation:
            queriedActiveConversation ?? retainedActiveConversation ?? restoredActiveConversation ?? conversations[0],
        displayedConversations: retainConversationForTab(conversations, retainedConversation, selectedTab),
    };
}

export function isConversationVisibleInTab(
    conversation: DirectMessageConversation,
    selectedTab: InboxTab,
    activeConversationId: string,
) {
    if (conversation.id === activeConversationId) return true;
    if (selectedTab === 'unread') return conversation.unreadCount > 0 && !conversation.isRequest;
    if (selectedTab === 'requests') return Boolean(conversation.isRequest);
    return !conversation.isRequest;
}
