import { describe, expect, it } from 'vitest';

import {
    enrichActivityWithFifa,
    enrichSportsEventWithFifa,
    indexFifaMatchResultsBySlug,
    mapFifaKickStatus,
    overlaySportEventDataWithFifa,
    toPenaltyShootout,
} from '@/helpers/prediction/fifaMatchResults.js';
import type { BetsActivity, FifaMatchResultData, PolymarketSportsEvent } from '@/providers/types/Firefly.js';
import type { SportEventData } from '@/types/prediction.js';
import { SportScoreType } from '@/types/prediction.js';

const SHOOTOUT_SLUG = 'fifwc-nld-mar-2026-06-29';

function baseFifaMatch(overrides: Partial<FifaMatchResultData> = {}): FifaMatchResultData {
    return {
        fixture_id: 1,
        stage: 'Final',
        status: 'completed',
        event_slug: SHOOTOUT_SLUG,
        teams: [
            { country_code: 'NLD', name: 'Netherlands', flag_url: '', team_color: '', text_color: '' },
            { country_code: 'MAR', name: 'Morocco', flag_url: '', team_color: '', text_color: '' },
        ],
        scores: [2, 2],
        penalty_scores: [4, 3],
        has_penalty_shootout: true,
        penalty_kicks: {
            home: ['scored', 'scored', 'missed', 'scored', 'scored', 'scored'],
            away: ['scored', 'missed', 'scored', 'scored', 'scored', 'missed'],
        },
        ...overrides,
    };
}

function baseEvent(overrides: Partial<PolymarketSportsEvent> = {}): PolymarketSportsEvent {
    return {
        id: 'evt-1',
        slug: SHOOTOUT_SLUG,
        title: 'NLD vs MAR',
        volume: 1000,
        volume24hr: 500,
        startDate: '2026-06-29T22:00:00Z',
        markets: [],
        ...overrides,
    } as PolymarketSportsEvent;
}

function baseSportData(overrides: Partial<SportEventData> = {}): SportEventData {
    return {
        gameId: 42,
        live: false,
        ended: false,
        homeTeam: { name: 'Netherlands' },
        awayTeam: { name: 'Morocco' },
        scores: [{ score: [2, 2] }],
        scoreType: SportScoreType.Single,
        isDraw: true,
        ...overrides,
    };
}

function baseActivity(overrides: Partial<BetsActivity> = {}): BetsActivity {
    return {
        topicId: SHOOTOUT_SLUG,
        sportData: { isDraw: true, ended: true, winResult: 1, leagueName: 'World Cup' },
        ...overrides,
    } as BetsActivity;
}

describe('mapFifaKickStatus', () => {
    it('maps Sportmonks strings to the numeric 0|1|2 union', () => {
        expect(mapFifaKickStatus('scored')).toBe(1);
        expect(mapFifaKickStatus('missed')).toBe(2);
        expect(mapFifaKickStatus('pending')).toBe(0);
    });
});

describe('toPenaltyShootout', () => {
    it('returns undefined when there are no kicks', () => {
        expect(toPenaltyShootout(null)).toBeUndefined();
        expect(toPenaltyShootout(undefined)).toBeUndefined();
    });

    it('maps each kick through mapFifaKickStatus, preserving order and length', () => {
        const shootout = toPenaltyShootout({
            home: ['scored', 'missed', 'pending'],
            away: ['pending', 'scored'],
        });
        expect(shootout).toEqual({ home: [1, 2, 0], away: [0, 1] });
    });
});

describe('indexFifaMatchResultsBySlug', () => {
    it('indexes matches by event_slug', () => {
        const map = indexFifaMatchResultsBySlug([
            baseFifaMatch({ event_slug: 'fifwc-a-b-2026-06-29' }),
            baseFifaMatch({ event_slug: 'fifwc-c-d-2026-06-30', fixture_id: 2 }),
        ]);
        expect(map.size).toBe(2);
        expect(map.get('fifwc-a-b-2026-06-29')?.fixture_id).toBe(1);
        expect(map.get('fifwc-c-d-2026-06-30')?.fixture_id).toBe(2);
    });

    it('skips matches with missing/blank slugs', () => {
        const map = indexFifaMatchResultsBySlug([
            baseFifaMatch({ event_slug: null }),
            baseFifaMatch({ event_slug: '   ' }),
            baseFifaMatch({ event_slug: 'fifwc-a-b-2026-06-29' }),
        ]);
        expect(map.size).toBe(1);
    });

    it('keeps the first match for a duplicate slug', () => {
        const map = indexFifaMatchResultsBySlug([
            baseFifaMatch({ event_slug: 'dup', fixture_id: 10 }),
            baseFifaMatch({ event_slug: 'dup', fixture_id: 20 }),
        ]);
        expect(map.get('dup')?.fixture_id).toBe(10);
    });
});

describe('enrichSportsEventWithFifa', () => {
    it('injects penaltyShootout for a shootout game (finished, >5 kicks each)', () => {
        const event = baseEvent();
        const fifa = baseFifaMatch();
        const enriched = enrichSportsEventWithFifa(event, fifa);
        expect(enriched.penaltyShootout).toEqual({
            home: [1, 1, 2, 1, 1, 1],
            away: [1, 2, 1, 1, 1, 2],
        });
    });

    it('overrides the latest score_show with the fresher FIFA score for in-progress matches', () => {
        const event = baseEvent({ score_show: [{ score: [1, 1] }] });
        const fifa = baseFifaMatch({
            status: 'in_progress',
            scores: [2, 1],
            has_penalty_shootout: false,
            penalty_kicks: null,
        });
        const enriched = enrichSportsEventWithFifa(event, fifa);
        expect(enriched.score_show?.at(-1)?.score).toEqual([2, 1]);
    });

    it('seeds a score_show entry when Polymarket had none', () => {
        const event = baseEvent();
        const fifa = baseFifaMatch({
            status: 'in_progress',
            scores: [1, 0],
            has_penalty_shootout: false,
            penalty_kicks: null,
        });
        const enriched = enrichSportsEventWithFifa(event, fifa);
        expect(enriched.score_show).toEqual([{ score: [1, 0] }]);
    });

    it('does not override the score for finished matches (Polymarket final score is authoritative)', () => {
        const event = baseEvent({ score_show: [{ score: [2, 2] }] });
        const fifa = baseFifaMatch({ status: 'completed', scores: [3, 0] });
        const enriched = enrichSportsEventWithFifa(event, fifa);
        expect(enriched.score_show?.at(-1)?.score).toEqual([2, 2]);
    });

    it('returns the same ref when there is nothing to merge', () => {
        const event = baseEvent();
        const fifa = baseFifaMatch({
            status: 'scheduled',
            scores: null,
            has_penalty_shootout: false,
            penalty_kicks: null,
        });
        expect(enrichSportsEventWithFifa(event, fifa)).toBe(event);
    });

    it('returns the same ref when the FIFA match is absent', () => {
        const event = baseEvent();
        expect(enrichSportsEventWithFifa(event, undefined)).toBe(event);
    });

    it('still injects penaltyShootout when kicks are briefly null', () => {
        const event = baseEvent();
        const fifa = baseFifaMatch({ penalty_kicks: null });
        const enriched = enrichSportsEventWithFifa(event, fifa);
        expect(enriched.penaltyShootout).toEqual({ home: [], away: [] });
    });
});

describe('overlaySportEventDataWithFifa', () => {
    it('injects penaltyShootout for a shootout game', () => {
        const data = baseSportData();
        const fifa = baseFifaMatch();
        const overlay = overlaySportEventDataWithFifa(data, fifa);
        expect(overlay.penaltyShootout).toEqual({
            home: [1, 1, 2, 1, 1, 1],
            away: [1, 2, 1, 1, 1, 2],
        });
    });

    it('overrides scores[0] with the fresher FIFA score for in-progress matches', () => {
        const data = baseSportData({ scores: [{ score: [1, 1] }] });
        const fifa = baseFifaMatch({
            status: 'in_progress',
            scores: [2, 1],
            has_penalty_shootout: false,
            penalty_kicks: null,
        });
        const overlay = overlaySportEventDataWithFifa(data, fifa);
        expect(overlay.scores[0].score).toEqual([2, 1]);
    });

    it('returns the same ref when there is nothing to merge', () => {
        const data = baseSportData();
        const fifa = baseFifaMatch({
            status: 'scheduled',
            scores: null,
            has_penalty_shootout: false,
            penalty_kicks: null,
        });
        expect(overlaySportEventDataWithFifa(data, fifa)).toBe(data);
        expect(overlaySportEventDataWithFifa(data, undefined)).toBe(data);
    });
});

describe('enrichActivityWithFifa', () => {
    it('injects penaltyShootout into sportData for a shootout match', () => {
        const activity = baseActivity();
        const enriched = enrichActivityWithFifa(activity, baseFifaMatch());
        expect(enriched.sportData?.penaltyShootout).toEqual({
            home: [1, 1, 2, 1, 1, 1],
            away: [1, 2, 1, 1, 1, 2],
        });
    });

    it('preserves the rest of sportData', () => {
        const activity = baseActivity();
        const enriched = enrichActivityWithFifa(activity, baseFifaMatch());
        expect(enriched.sportData?.leagueName).toBe('World Cup');
        expect(enriched.sportData?.isDraw).toBe(true);
    });

    it('returns the same ref when the FIFA match is absent', () => {
        const activity = baseActivity();
        expect(enrichActivityWithFifa(activity, undefined)).toBe(activity);
    });

    it('returns the same ref when there is no shootout', () => {
        const activity = baseActivity();
        const fifa = baseFifaMatch({ has_penalty_shootout: false, penalty_kicks: null });
        expect(enrichActivityWithFifa(activity, fifa)).toBe(activity);
    });

    it('returns the same ref when the activity has no sportData', () => {
        const activity = baseActivity({ sportData: undefined });
        expect(enrichActivityWithFifa(activity, baseFifaMatch())).toBe(activity);
    });

    it('still injects penaltyShootout when kicks are briefly null', () => {
        const activity = baseActivity();
        const fifa = baseFifaMatch({ penalty_kicks: null });
        const enriched = enrichActivityWithFifa(activity, fifa);
        expect(enriched.sportData?.penaltyShootout).toEqual({ home: [], away: [] });
    });
});
