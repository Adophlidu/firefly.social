import type { RetainedConversation } from '@/components/DirectMessages/conversationNavigation.js';
import type { InboxTab } from '@/components/DirectMessages/types.js';

const DM_SELECTION_HISTORY_KEY = 'fireflyDmSelection';

interface DmHistorySelection {
    account: string;
    retainedConversation: RetainedConversation;
}

function getHistoryState(): Record<string, unknown> {
    const state: unknown = window.history.state;
    return state && typeof state === 'object' ? { ...(state as Record<string, unknown>) } : {};
}

export function clearDmTargetIntent() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('to')) return;

    url.searchParams.delete('to');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export function replaceDmConversationInUrl(channelId?: string, selection?: DmHistorySelection) {
    const url = new URL(window.location.href);
    const currentChannelId = url.searchParams.get('channel');
    const nextState = getHistoryState();
    const hasSameChannel = currentChannelId === channelId || (!currentChannelId && !channelId);

    if (selection) nextState[DM_SELECTION_HISTORY_KEY] = selection;
    else if (!channelId) delete nextState[DM_SELECTION_HISTORY_KEY];
    if (hasSameChannel && !selection && channelId) return;

    if (channelId) url.searchParams.set('channel', channelId);
    else url.searchParams.delete('channel');
    window.history.replaceState(nextState, '', `${url.pathname}${url.search}${url.hash}`);
}

export function getDmRetainedConversation(account: string, channelId: string) {
    const selection = getHistoryState()[DM_SELECTION_HISTORY_KEY] as DmHistorySelection | undefined;
    if (selection?.account.toLowerCase() !== account.toLowerCase()) return undefined;
    if (selection.retainedConversation.conversation.id !== channelId) return undefined;
    return selection.retainedConversation;
}

export function replaceDmInboxTabInUrl(tab: InboxTab) {
    const url = new URL(window.location.href);
    const nextTab = tab === 'all' ? null : tab;
    if (url.searchParams.get('tab') === nextTab) return;

    if (nextTab) url.searchParams.set('tab', nextTab);
    else url.searchParams.delete('tab');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}
