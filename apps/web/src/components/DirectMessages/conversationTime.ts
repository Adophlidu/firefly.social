import { getTwitterFormat } from '@/helpers/formatTimestamp.js';

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatConversationTime(value: string | null | undefined) {
    return value ? getTwitterFormat(value) : '';
}

export function getConversationTimeRefreshInterval(lastMessageAt: string | null | undefined, now: number) {
    if (!lastMessageAt) return null;

    const timestamp = Date.parse(lastMessageAt);
    if (Number.isNaN(timestamp)) return null;

    const age = Math.abs(now - timestamp);
    if (age < MINUTE) return SECOND;
    if (age < HOUR) return MINUTE;
    if (age < DAY) return HOUR;
    return DAY;
}
