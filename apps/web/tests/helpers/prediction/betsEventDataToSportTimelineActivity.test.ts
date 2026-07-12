import { PredictionPlatform } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import { betsEventDataToSportTimelineActivity } from '@/helpers/prediction/betsEventDataToSportTimelineActivity.js';
import type { BetsEventDataForUI, BetsMarketDataForUI, SportEventData } from '@/types/prediction.js';
import { SportScoreType } from '@/types/prediction.js';

function buildMarket(over: Partial<BetsMarketDataForUI>): BetsMarketDataForUI {
    return {
        id: 'm',
        conditionId: 'c',
        questionId: 'q',
        title: 'Moneyline',
        volume: '0',
        isResolved: false,
        isClosed: false,
        createTime: 0,
        sportsMarketType: 'moneyline',
        outcomes: [],
        ...over,
    };
}

function buildSportData(over: Partial<SportEventData>): SportEventData {
    return {
        gameId: 1,
        live: false,
        ended: false,
        homeTeam: { name: 'Qatar', abbreviation: 'QAT' },
        awayTeam: { name: 'Switzerland', abbreviation: 'SUI' },
        scores: [{ score: [0, 0] }],
        scoreType: SportScoreType.Single,
        isDraw: true,
        ...over,
    };
}

function buildEvent(over: Partial<BetsEventDataForUI>): BetsEventDataForUI {
    return {
        id: 'e',
        title: 'Qatar vs Switzerland',
        endTime: 0,
        isSingleEvent: true,
        platform: PredictionPlatform.Polymarket,
        status: 'active',
        markets: [],
        volume: '1000',
        sportData: buildSportData({}),
        ...over,
    };
}

/** A 3-way merged moneyline (outcomes ordered [home, away, "Draw"]) with 3 binary legs. */
function mergedThreeWayMoneyline(): BetsMarketDataForUI {
    return buildMarket({
        id: 'm-merged',
        slug: 'qatar-vs-switzerland-moneyline-home',
        outcomes: [
            { id: 'o-home', label: 'QAT', price: '0.4' },
            { id: 'o-away', label: 'SUI', price: '0.3' },
            { id: 'o-draw', label: 'Draw', price: '0.3' },
        ],
        originalMoneylineMarkets: [
            buildMarket({
                id: 'leg-home',
                slug: 'qatar-vs-switzerland-moneyline-home',
                groupItemTitle: 'Qatar',
                outcomes: [{ id: 'y', label: 'Yes', price: '0.4' }],
            }),
            buildMarket({
                id: 'leg-away',
                slug: 'qatar-vs-switzerland-moneyline-away',
                groupItemTitle: 'Switzerland',
                outcomes: [{ id: 'y', label: 'Yes', price: '0.3' }],
            }),
            buildMarket({
                id: 'leg-draw',
                slug: 'qatar-vs-switzerland-moneyline-draw',
                groupItemTitle: 'Draw',
                outcomes: [{ id: 'y', label: 'Yes', price: '0.3' }],
            }),
        ],
    });
}

describe('betsEventDataToSportTimelineActivity', () => {
    describe('3-way (home/draw/away) event', () => {
        const activity = betsEventDataToSportTimelineActivity(buildEvent({ markets: [mergedThreeWayMoneyline()] }))!;

        it('returns an activity (not null)', () => {
            expect(activity).not.toBeNull();
        });

        it('maps 3 conditionOutcomes from the merged moneyline outcomes', () => {
            expect(activity.conditionOutcomes).toEqual(['QAT', 'SUI', 'Draw']);
            expect(activity.conditionOutcomePrices).toEqual(['0.4', '0.3', '0.3']);
        });

        it('builds 3 per-leg gameData.markets with groupTypeFF home(0)/away(2)/draw(1) and per-leg slugs', () => {
            const markets = activity.gameData?.markets;
            expect(markets).toHaveLength(3);

            const bySlugSuffix = Object.fromEntries((markets ?? []).map((m) => [m.slug?.split('-').pop(), m]));
            expect(bySlugSuffix.home?.groupTypeFF).toBe(0);
            expect(bySlugSuffix.away?.groupTypeFF).toBe(2);
            expect(bySlugSuffix.draw?.groupTypeFF).toBe(1);

            // Each leg market exposes its own Yes price for the buy button.
            expect(bySlugSuffix.home?.outcomePrices).toBe(JSON.stringify(['0.4']));
            expect(bySlugSuffix.away?.outcomePrices).toBe(JSON.stringify(['0.3']));
            expect(bySlugSuffix.draw?.outcomePrices).toBe(JSON.stringify(['0.3']));

            expect(bySlugSuffix.home?.slug).toBe('qatar-vs-switzerland-moneyline-home');
        });

        it('sets drawTeams and marketTeams from the sport event teams', () => {
            expect(activity.sportData?.drawTeams).toHaveLength(2);
            expect(activity.sportData?.marketTeams).toHaveLength(2);
            expect(activity.sportData?.drawTeams?.[0]?.abbreviation).toBe('QAT');
        });

        it('maps scores/period/scoreType through to scoreShow/periodShow/scoreType', () => {
            const event = buildEvent({
                markets: [mergedThreeWayMoneyline()],
                sportData: buildSportData({
                    scores: [{ score: [2, 1] }],
                    scoreType: SportScoreType.Multiple,
                    period: '2nd Half',
                }),
            });
            const act = betsEventDataToSportTimelineActivity(event)!;
            expect(act.sportData?.scoreShow).toEqual([{ score: [2, 1] }]);
            expect(act.sportData?.scoreType).toBe(SportScoreType.Multiple);
            expect(act.sportData?.periodShow).toBe('2nd Half');
        });
    });

    describe('binary (2-way) event', () => {
        const binary = buildMarket({
            id: 'm-binary',
            slug: 'lakers-vs-celtics',
            outcomes: [
                { id: 'o-h', label: 'Lakers', price: '0.6' },
                { id: 'o-a', label: 'Celtics', price: '0.4' },
            ],
        });
        const activity = betsEventDataToSportTimelineActivity(
            buildEvent({
                markets: [binary],
                sportData: buildSportData({ isDraw: false }),
            }),
        )!;

        it('omits gameData so the card falls back to the single moneyline slug', () => {
            expect(activity.gameData).toBeUndefined();
        });

        it('maps 2 conditionOutcomes and the moneyline slug', () => {
            expect(activity.conditionOutcomes).toEqual(['Lakers', 'Celtics']);
            expect(activity.conditionOutcomePrices).toEqual(['0.6', '0.4']);
            expect(activity.slug).toBe('lakers-vs-celtics');
            expect(activity.rawData?.slug).toBe('lakers-vs-celtics');
        });

        it('leaves drawTeams unset when the game is not a draw market', () => {
            expect(activity.sportData?.drawTeams).toBeUndefined();
            expect(activity.sportData?.marketTeams).toHaveLength(2);
        });
    });

    describe('sport status flows into sportData', () => {
        it('live game: live=true, ended=false', () => {
            const act = betsEventDataToSportTimelineActivity(
                buildEvent({
                    markets: [mergedThreeWayMoneyline()],
                    sportData: buildSportData({ live: true, ended: false }),
                }),
            )!;
            expect(act.sportData?.live).toBe(true);
            expect(act.sportData?.ended).toBe(false);
        });

        it('scheduled game: live=false, ended=false, closed=false', () => {
            const act = betsEventDataToSportTimelineActivity(
                buildEvent({
                    markets: [mergedThreeWayMoneyline()],
                    sportData: buildSportData({ live: false, ended: false }),
                }),
            )!;
            expect(act.sportData?.live).toBe(false);
            expect(act.sportData?.ended).toBe(false);
            expect(act.sportData?.closed).toBe(false);
        });

        it('final game: ended=true and closed derives from status', () => {
            const act = betsEventDataToSportTimelineActivity(
                buildEvent({
                    status: 'ended',
                    markets: [mergedThreeWayMoneyline()],
                    sportData: buildSportData({ ended: true }),
                }),
            )!;
            expect(act.sportData?.ended).toBe(true);
            expect(act.sportData?.closed).toBe(true);
        });

        it('explicit event.closed overrides status-derived closed', () => {
            const act = betsEventDataToSportTimelineActivity(
                buildEvent({
                    status: 'active',
                    closed: true,
                    markets: [mergedThreeWayMoneyline()],
                    sportData: buildSportData({ ended: false }),
                }),
            )!;
            expect(act.sportData?.closed).toBe(true);
        });
    });

    describe('returns null when unusable', () => {
        it('returns null when there is no sportData', () => {
            const event = buildEvent({ sportData: undefined });
            expect(betsEventDataToSportTimelineActivity(event)).toBeNull();
        });

        it('returns null when there are no markets', () => {
            const event = buildEvent({ markets: [] });
            expect(betsEventDataToSportTimelineActivity(event)).toBeNull();
        });
    });

    it('prefers the moneyline market over a non-moneyline first market', () => {
        // A non-moneyline market sits first; the converter should still pick the moneyline.
        const spread = buildMarket({
            id: 'm-spread',
            sportsMarketType: 'spread',
            slug: 'some-spread',
            outcomes: [
                { id: 's1', label: 'Home -3', price: '0.5' },
                { id: 's2', label: 'Away +3', price: '0.5' },
            ],
        });
        const act = betsEventDataToSportTimelineActivity(buildEvent({ markets: [spread, mergedThreeWayMoneyline()] }))!;
        expect(act.conditionOutcomes).toEqual(['QAT', 'SUI', 'Draw']);
        expect(act.gameData?.markets).toHaveLength(3);
    });
});
