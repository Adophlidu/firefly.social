import type { DirectMessageItem } from '@/components/DirectMessages/types.js';

const MESSAGE_GROUP_WINDOW_MS = 5 * 60_000;

function toCalendarKey(value: string) {
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function shouldShowMessageDateDivider(previous: DirectMessageItem | undefined, current: DirectMessageItem) {
    return !previous || toCalendarKey(previous.createdAt) !== toCalendarKey(current.createdAt);
}

export function areMessagesGrouped(previous: DirectMessageItem | undefined, current: DirectMessageItem) {
    if (previous?.isSelf !== current.isSelf) return false;
    if (toCalendarKey(previous.createdAt) !== toCalendarKey(current.createdAt)) return false;

    const elapsed = new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime();
    return elapsed >= 0 && elapsed <= MESSAGE_GROUP_WINDOW_MS;
}

export function resolveMessageDateKind(value: string, now = new Date()): 'today' | 'yesterday' | 'date' {
    const date = new Date(value);
    if (toCalendarKey(value) === toCalendarKey(now.toISOString())) return 'today';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return toCalendarKey(value) === toCalendarKey(yesterday.toISOString()) ? 'yesterday' : 'date';
}

export function findFirstUnreadMessageIndex(
    messages: DirectMessageItem[],
    lastReadMessageId: string | null,
    unreadCount: number,
) {
    if (!unreadCount || !messages.length) return -1;
    const lastReadIndex = lastReadMessageId ? messages.findIndex((message) => message.id === lastReadMessageId) : -1;
    if (lastReadIndex >= 0 && lastReadIndex + 1 < messages.length) return lastReadIndex + 1;
    return Math.max(0, messages.length - unreadCount);
}

export function countNewReceivedMessages(
    messages: DirectMessageItem[],
    knownMessageIds: ReadonlySet<string>,
    latestKnownMessageTime: number,
) {
    return messages.filter(
        (message) =>
            !message.isSelf &&
            !knownMessageIds.has(message.id) &&
            new Date(message.createdAt).getTime() > latestKnownMessageTime,
    ).length;
}

export function findLatestServerMessage<T extends { is_optimistic?: boolean }>(messages: T[]) {
    return messages.findLast((message) => !message.is_optimistic);
}
