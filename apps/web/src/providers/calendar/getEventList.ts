import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { CALENDAR_BASE_URL } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { formatEvent } from '@/providers/calendar/formatEvent.js';
import type { EventResponse } from '@/types/calendar.js';

export async function getEventList(start_date: number, end_date: number, indicator?: PageIndicator) {
    const response = await fetchJson<EventResponse>(
        urlcat(CALENDAR_BASE_URL, 'crypto_event_list', {
            provider_type: 'luma',
            size: 100,
            cursor: indicator?.id,
            start_date: Math.floor(start_date / 1000),
            end_date: Math.floor(end_date / 1000),
        }),
    );
    if (!response?.data?.events.length) return createPageable([], createIndicator(indicator));

    const events = response.data.events.map(formatEvent);
    const next = response.data.page.next;
    return createPageable(events, indicator, next && next !== '0' ? createNextIndicator(indicator, next) : undefined);
}
