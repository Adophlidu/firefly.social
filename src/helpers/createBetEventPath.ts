import urlcat from 'urlcat';

export interface BetEventQuery {
    outcome?: number;
    side?: string;
}

export function createBetEventPath(eventIdOrSlug: string, query: BetEventQuery = {}) {
    return urlcat('/bet/event/:id', {
        id: eventIdOrSlug,
        ...query,
        source: 'firefly',
    });
}
