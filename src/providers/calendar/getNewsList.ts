import urlcat from 'urlcat';

import { CALENDAR_BASE_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { formatEventDate } from '@/providers/calendar/formatEventDate.js';
import type { EventResponse } from '@/types/calendar.js';

export async function getNewsList(startDate: number, endDate?: number, indicator?: PageIndicator) {
    const response = await fetchJson<EventResponse>(
        urlcat(CALENDAR_BASE_URL, 'crypto_event_list', {
            provider_type: 'coincarp',
            size: 100,
            start_date: Math.floor(startDate / 1000),
            end_date: endDate ? Math.floor(endDate / 1000) : 0,
            cursor: indicator?.id,
        }),
    );
    if (!response.data?.events.length) return createPageable([], createIndicator(indicator));
    const events = response.data.events.map(formatEventDate);
    const next = response.data.page.next;
    return createPageable(events, indicator, next && next !== '0' ? createNextIndicator(indicator, next) : undefined);
}
