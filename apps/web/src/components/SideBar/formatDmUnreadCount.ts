export function formatDmUnreadCount(count: number) {
    return count > 99 ? '99+' : count.toString();
}
