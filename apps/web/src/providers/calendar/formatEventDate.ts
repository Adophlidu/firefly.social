import { type Event, type ParsedEvent } from '@/types/calendar.js';

export function formatEventDate(event: Event): ParsedEvent {
    return {
        ...event,
        event_date: +event.event_date * 1000,
    };
}
