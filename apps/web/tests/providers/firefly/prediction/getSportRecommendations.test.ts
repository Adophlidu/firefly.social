import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    getSportRecommendations,
    getSportRecommendationsResult,
} from '@/providers/firefly/prediction/getSportRecommendations.js';
import { getSportsEventList } from '@/providers/firefly/prediction/getSportsEventList.js';
import type {
    PolymarketSportsEvent,
    PolymarketSportsListResponse,
    PolymarketSportsMarketData,
} from '@/providers/types/Firefly.js';

vi.mock('@/providers/firefly/prediction/getSportsEventList.js', () => ({
    getSportsEventList: vi.fn(),
}));

function createSportsEvent(overrides: Partial<PolymarketSportsEvent> = {}): PolymarketSportsEvent {
    const id = overrides.id || overrides.slug || 'event-1';

    return {
        id,
        slug: id,
        title: id,
        gameId: id,
        game_status: 0,
        startDate: '2026-05-29T12:00:00Z',
        markets: [
            {
                sportsMarketType: 'moneyline',
                outcomes: '["Home","Away"]',
                outcomePrices: '["0.5","0.5"]',
                teams: [{ name: 'Home' }, { name: 'Away' }],
            } as PolymarketSportsMarketData,
        ],
        ...overrides,
    } as PolymarketSportsEvent;
}

function createSportsListResponse(
    overrides: Partial<Omit<PolymarketSportsListResponse, 'timezone'>> = {},
): PolymarketSportsListResponse {
    return {
        timezone: 'UTC',
        live: [],
        today: [],
        tomorrow: [],
        afterTomorrow: [],
        closed: [],
        ...overrides,
    };
}

const mockedGetSportsEventList = vi.mocked(getSportsEventList);

describe('getSportRecommendationsResult', () => {
    beforeEach(() => {
        mockedGetSportsEventList.mockReset();
    });

    it('falls back to the live category when the league has no recommendations', async () => {
        mockedGetSportsEventList.mockResolvedValueOnce(createSportsListResponse()).mockResolvedValueOnce(
            createSportsListResponse({
                live: [
                    createSportsEvent({ id: 'current-game', gameId: 'current-game' }),
                    createSportsEvent({ id: 'live-game' }),
                ],
            }),
        );

        const result = await getSportRecommendationsResult('mlb', 'current-game');

        expect(mockedGetSportsEventList).toHaveBeenNthCalledWith(1, {
            children_tag_slug: 'mlb',
            children_tag_slug_type: 'league',
        });
        expect(mockedGetSportsEventList).toHaveBeenNthCalledWith(2, {
            children_tag_slug: 'live',
        });
        expect(result.categorySlug).toBe('live');
        expect(result.categoryTagType).toBeUndefined();
        expect(result.events.map((event) => event.slug)).toEqual(['live-game']);
    });

    it('prefers league recommendations and fills remaining slots from live results', async () => {
        mockedGetSportsEventList
            .mockResolvedValueOnce(
                createSportsListResponse({
                    today: [createSportsEvent({ id: 'league-game' })],
                }),
            )
            .mockResolvedValueOnce(
                createSportsListResponse({
                    live: [createSportsEvent({ id: 'league-game' }), createSportsEvent({ id: 'other-live-game' })],
                }),
            );

        const result = await getSportRecommendationsResult('mlb', 'current-game');

        expect(result.categorySlug).toBe('mlb');
        expect(result.categoryTagType).toBe('league');
        expect(result.events.map((event) => event.slug)).toEqual(['league-game', 'other-live-game']);
    });

    it('keeps the existing array API for client consumers', async () => {
        mockedGetSportsEventList.mockResolvedValueOnce(
            createSportsListResponse({
                live: [createSportsEvent({ id: 'live-game' })],
            }),
        );

        await expect(getSportRecommendations(undefined, 'current-game')).resolves.toEqual([
            expect.objectContaining({ slug: 'live-game' }),
        ]);
    });

    it('filters live fallback events by sport tag when sportTagSlugs is provided', async () => {
        mockedGetSportsEventList.mockResolvedValueOnce(createSportsListResponse()).mockResolvedValueOnce(
            createSportsListResponse({
                live: [
                    createSportsEvent({
                        id: 'rugby-match',
                        tags: [{ id: '1', label: 'Rugby', slug: 'rugby' }] as any,
                    }),
                    createSportsEvent({
                        id: 'esports-match',
                        tags: [{ id: '2', label: 'Esports', slug: 'esports' }] as any,
                    }),
                    createSportsEvent({
                        id: 'football-match',
                        tags: [{ id: '3', label: 'American Football', slug: 'american-football' }] as any,
                    }),
                ],
            }),
        );

        const result = await getSportRecommendationsResult('nfl', 'current-game', ['rugby', 'american-football']);

        expect(result.events.map((event) => event.slug)).toEqual(['rugby-match', 'football-match']);
    });

    it('does not filter live fallback events when sportTagSlugs is not provided', async () => {
        mockedGetSportsEventList.mockResolvedValueOnce(createSportsListResponse()).mockResolvedValueOnce(
            createSportsListResponse({
                live: [
                    createSportsEvent({
                        id: 'rugby-match',
                        tags: [{ id: '1', label: 'Rugby', slug: 'rugby' }] as any,
                    }),
                    createSportsEvent({
                        id: 'esports-match',
                        tags: [{ id: '2', label: 'Esports', slug: 'esports' }] as any,
                    }),
                ],
            }),
        );

        const result = await getSportRecommendationsResult('nfl', 'current-game');

        expect(result.events.map((event) => event.slug)).toEqual(['rugby-match', 'esports-match']);
    });

    it('passes through events with no tags when sportTagSlugs is provided', async () => {
        mockedGetSportsEventList.mockResolvedValueOnce(createSportsListResponse()).mockResolvedValueOnce(
            createSportsListResponse({
                live: [
                    createSportsEvent({ id: 'no-tags-match' }),
                    createSportsEvent({
                        id: 'esports-match',
                        tags: [{ id: '2', label: 'Esports', slug: 'esports' }] as any,
                    }),
                ],
            }),
        );

        const result = await getSportRecommendationsResult('nfl', 'current-game', ['rugby']);

        // no-tags-match passes through (graceful degradation), esports-match is filtered out
        expect(result.events.map((event) => event.slug)).toEqual(['no-tags-match']);
    });
});
