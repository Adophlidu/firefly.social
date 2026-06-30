import { describe, expect, it } from 'vitest';

import { normalizeFifaBracketDto } from '@/helpers/prediction/category/bracket/normalizeFifaBracketDto.js';

const RAW = {
    rounds: [
        {
            id: 'r32',
            matches: [
                {
                    id: 'r32-2',
                    round_id: 'r32',
                    start_time: '2026-06-28T19:00:00-04:00',
                    status: 'upcoming',
                    teams: [
                        {
                            country_code: 'RSA',
                            name: 'South Africa',
                            flag_url: 'https://example.com/South Africa-ddc27e566d.png',
                            team_color: '#10704b',
                        },
                        {
                            country_code: 'CAN',
                            name: 'Canada',
                            flag_url: 'https://example.com/Canada.png',
                            team_color: '#d8022e',
                        },
                    ],
                    scores: [2, 1],
                    market_slugs: ['rsa-can-market', null],
                    event_slug: null,
                    feeds_into_match_id: 'r16-1',
                },
                {
                    id: 'r32-1',
                    round_id: 'r32',
                    start_time: null,
                    status: 'tbd',
                    teams: [null, null],
                    scores: null,
                    market_slugs: [null, null],
                    event_slug: null,
                    feeds_into_match_id: 'r16-0',
                },
            ],
        },
        {
            id: 'final',
            matches: [
                {
                    id: 'final-0',
                    round_id: 'final',
                    start_time: '2026-07-19T15:00:00-04:00',
                    status: 'final',
                    teams: [null, null],
                    scores: null,
                    market_slugs: [null, null],
                    event_slug: 'world-cup-final',
                    feeds_into_match_id: null,
                },
            ],
        },
    ],
};

describe('normalizeFifaBracketDto', () => {
    it('maps snake_case fields to camelCase across rounds and matches', () => {
        const data = normalizeFifaBracketDto({ ...RAW, updated_at: '2026-06-27T10:00:00Z' });
        expect(data.updatedAt).toBe('2026-06-27T10:00:00Z');
        expect(data.rounds.map((r) => r.id)).toEqual(['r32', 'final']);

        const m = data.rounds[0].matches[0];
        expect(m.id).toBe('r32-2');
        expect(m.roundId).toBe('r32');
        expect(m.startTime).toBe('2026-06-28T19:00:00-04:00');
        expect(m.status).toBe('upcoming');
        expect(m.scores).toEqual([2, 1]);
        expect(m.marketSlugs).toEqual(['rsa-can-market', null]);
        expect(m.feedsIntoMatchId).toBe('r16-1');

        const team = m.teams[0]!;
        expect(team.name).toBe('South Africa');
        expect(team.countryCode).toBe('RSA');
        expect(team.teamColor).toBe('#10704b');
        expect(team.flagUrl).toBe('https://example.com/South%20Africa-ddc27e566d.png');
    });

    it('preserves null team slots (TBD) and null scores', () => {
        const data = normalizeFifaBracketDto(RAW);
        const tbd = data.rounds[0].matches[1];
        expect(tbd.teams).toEqual([null, null]);
        expect(tbd.scores).toBeNull();
    });

    it('keeps the final with null feedsIntoMatchId and a non-null eventSlug', () => {
        const data = normalizeFifaBracketDto(RAW);
        const finalMatch = data.rounds[1].matches[0];
        expect(finalMatch.feedsIntoMatchId).toBeNull();
        expect(finalMatch.eventSlug).toBe('world-cup-final');
    });

    it('encodeURI-escapes flag URLs containing literal spaces', () => {
        const data = normalizeFifaBracketDto(RAW);
        expect(data.rounds[0].matches[0].teams[0]!.flagUrl).toBe('https://example.com/South%20Africa-ddc27e566d.png');
    });

    it('collapses inner-null scores tuples to a null scores value', () => {
        const data = normalizeFifaBracketDto({
            rounds: [
                {
                    id: 'r16',
                    matches: [
                        {
                            id: 'a',
                            round_id: 'r16',
                            start_time: null,
                            status: 'live',
                            teams: [null, null],
                            scores: [1, null],
                            market_slugs: [null, null],
                            event_slug: null,
                            feeds_into_match_id: null,
                        },
                        {
                            id: 'b',
                            round_id: 'r16',
                            start_time: null,
                            status: 'live',
                            teams: [null, null],
                            scores: [null, null],
                            market_slugs: [null, null],
                            event_slug: null,
                            feeds_into_match_id: null,
                        },
                    ],
                },
            ],
            updated_at: null,
        });
        expect(data.rounds[0].matches[0].scores).toBeNull();
        expect(data.rounds[0].matches[1].scores).toBeNull();
    });

    it('drops matches with an unknown round_id but keeps valid siblings', () => {
        const data = normalizeFifaBracketDto({
            rounds: [
                {
                    id: 'r16',
                    matches: [
                        {
                            id: 'good',
                            round_id: 'r16',
                            start_time: null,
                            status: 'tbd',
                            teams: [null, null],
                            scores: null,
                            market_slugs: [null, null],
                            event_slug: null,
                            feeds_into_match_id: null,
                        },
                        {
                            id: 'bad',
                            round_id: 'third-place',
                            start_time: null,
                            status: 'tbd',
                            teams: [null, null],
                            scores: null,
                            market_slugs: [null, null],
                            event_slug: null,
                            feeds_into_match_id: null,
                        },
                    ],
                },
            ],
            updated_at: null,
        });
        expect(data.rounds[0].matches.map((m) => m.id)).toEqual(['good']);
    });

    it('drops rounds with an unknown id', () => {
        const data = normalizeFifaBracketDto({
            rounds: [
                { id: 'third-place', matches: [] },
                { id: 'r32', matches: [] },
            ],
            updated_at: null,
        });
        expect(data.rounds.map((r) => r.id)).toEqual(['r32']);
    });

    it('preserves the third-place round and match (rendered inside the Final column)', () => {
        const data = normalizeFifaBracketDto({
            rounds: [
                { id: 'r32', matches: [] },
                {
                    id: 'third',
                    matches: [
                        {
                            id: 'third-1',
                            round_id: 'third',
                            start_time: '2026-07-18T17:00:00-04:00',
                            status: 'tbd',
                            teams: [null, null],
                            scores: null,
                            market_slugs: [null, null],
                            event_slug: null,
                            feeds_into_match_id: null,
                        },
                    ],
                },
                {
                    id: 'final',
                    matches: [
                        {
                            id: 'final-1',
                            round_id: 'final',
                            start_time: null,
                            status: 'tbd',
                            teams: [null, null],
                            scores: null,
                            market_slugs: [null, null],
                            event_slug: null,
                            feeds_into_match_id: null,
                        },
                    ],
                },
            ],
            updated_at: null,
        });
        expect(data.rounds.map((r) => r.id)).toEqual(['r32', 'third', 'final']);
        const third = data.rounds.find((r) => r.id === 'third')!.matches[0];
        expect(third.id).toBe('third-1');
        expect(third.roundId).toBe('third');
        expect(third.feedsIntoMatchId).toBeNull();
    });

    it('extracts a third-place match nested inside the final round into its own round', () => {
        const data = normalizeFifaBracketDto({
            rounds: [
                {
                    id: 'final',
                    matches: [
                        {
                            id: 'third-1',
                            round_id: 'third',
                            start_time: null,
                            status: 'tbd',
                            teams: [null, null],
                            scores: null,
                            market_slugs: [null, null],
                            event_slug: null,
                            feeds_into_match_id: null,
                        },
                        {
                            id: 'final-1',
                            round_id: 'final',
                            start_time: null,
                            status: 'tbd',
                            teams: [null, null],
                            scores: null,
                            market_slugs: [null, null],
                            event_slug: null,
                            feeds_into_match_id: null,
                        },
                    ],
                },
            ],
            updated_at: null,
        });
        // The Final stays the final round's only match (so it remains matches[0]); third-1 moves out.
        const finalRound = data.rounds.find((r) => r.id === 'final')!;
        expect(finalRound.matches.map((m) => m.id)).toEqual(['final-1']);
        const third = data.rounds.find((r) => r.id === 'third')!.matches[0];
        expect(third.id).toBe('third-1');
        expect(third.roundId).toBe('third');
    });

    it('coerces missing team fields to empty strings without throwing', () => {
        const data = normalizeFifaBracketDto({
            rounds: [
                {
                    id: 'r16',
                    matches: [
                        {
                            id: 'x',
                            round_id: 'r16',
                            start_time: null,
                            status: 'tbd',
                            teams: [{ name: 'Partial' }, null],
                            scores: null,
                            market_slugs: [null, null],
                            event_slug: null,
                            feeds_into_match_id: null,
                        },
                    ],
                },
            ],
            updated_at: null,
        });
        const team = data.rounds[0].matches[0].teams[0]!;
        expect(team).toEqual({ name: 'Partial', countryCode: '', flagUrl: '', teamColor: '' });
    });

    it('treats an empty-string start_time as null', () => {
        const data = normalizeFifaBracketDto({
            rounds: [
                {
                    id: 'r16',
                    matches: [
                        {
                            id: 'x',
                            round_id: 'r16',
                            start_time: '',
                            status: 'tbd',
                            teams: [null, null],
                            scores: null,
                            market_slugs: [null, null],
                            event_slug: null,
                            feeds_into_match_id: null,
                        },
                    ],
                },
            ],
            updated_at: null,
        });
        expect(data.rounds[0].matches[0].startTime).toBeNull();
    });

    it('returns empty rounds on malformed input and null updatedAt on non-string', () => {
        expect(normalizeFifaBracketDto(null)).toEqual({ rounds: [], updatedAt: null });
        expect(normalizeFifaBracketDto(undefined)).toEqual({ rounds: [], updatedAt: null });
        expect(normalizeFifaBracketDto({}).rounds).toEqual([]);
        expect(normalizeFifaBracketDto({ rounds: 'x' }).rounds).toEqual([]);
        expect(normalizeFifaBracketDto({ rounds: [], updated_at: 123 }).updatedAt).toBeNull();
    });

    it('defaults a non-string status to "tbd"', () => {
        const data = normalizeFifaBracketDto({
            rounds: [
                {
                    id: 'r16',
                    matches: [
                        {
                            id: 'x',
                            round_id: 'r16',
                            start_time: null,
                            status: 5,
                            teams: [null, null],
                            scores: null,
                            market_slugs: [null, null],
                            event_slug: null,
                            feeds_into_match_id: null,
                        },
                    ],
                },
            ],
            updated_at: null,
        });
        expect(data.rounds[0].matches[0].status).toBe('tbd');
    });
});
