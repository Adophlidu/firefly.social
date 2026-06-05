import urlcat from 'urlcat';

export interface BetEventQuery {
    outcome?: number;
    side?: string;
    type?: 'limit' | 'market';
    limitPrice?: number;
    eventSlug?: string;
    conditionId?: string;
}

export function createBetEventPath(eventIdOrSlug: string, query: BetEventQuery = {}) {
    return urlcat('/bet/event/:id', {
        id: eventIdOrSlug,
        ...query,
        source: 'firefly',
    });
}
