import urlcat from 'urlcat';

export interface BetEventQuery {
    outcome?: number;
    side?: string;
    type?: 'limit' | 'market';
    limitPrice?: number;
}

export function createBetEventPath(eventIdOrSlug: string, query: BetEventQuery = {}) {
    return urlcat('/bet/event/:id', {
        id: eventIdOrSlug,
        ...query,
        source: 'firefly',
    });
}
