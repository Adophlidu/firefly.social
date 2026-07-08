import { describe, expect, it } from 'vitest';

import {
    getLoser,
    getPenaltyShootoutLoser,
    getResolvedSportOutcome,
    isPenaltyPeriod,
    type ResolvedSportOutcomeContext,
} from '@/helpers/prediction/sportScoreUtils.js';
import type { BetsMarketDataForUI, BetsMarketOutcome } from '@/types/prediction.js';
import { SportMarketGroupType } from '@/types/prediction.js';

describe('isPenaltyPeriod', () => {
    it('matches explicit penalty / shootout labels regardless of case', () => {
        expect(isPenaltyPeriod('Penalty Shootout')).toBe(true);
        expect(isPenaltyPeriod('PENALTY')).toBe(true);
        expect(isPenaltyPeriod('penalty')).toBe(true);
        expect(isPenaltyPeriod('Shootout')).toBe(true);
        expect(isPenaltyPeriod('Second half - penalty')).toBe(true);
    });

    it('is false for ordinary period / clock labels', () => {
        expect(isPenaltyPeriod('2nd Half')).toBe(false);
        expect(isPenaltyPeriod('Q4 - 3:20')).toBe(false);
        expect(isPenaltyPeriod('Final')).toBe(false);
        expect(isPenaltyPeriod('Live')).toBe(false);
    });

    it('is false for undefined and empty strings', () => {
        expect(isPenaltyPeriod(undefined)).toBe(false);
        expect(isPenaltyPeriod('')).toBe(false);
    });
});

describe('getPenaltyShootoutLoser', () => {
    it('returns undefined when there is no shootout', () => {
        expect(getPenaltyShootoutLoser(undefined)).toBeUndefined();
    });

    it('mutes the side that scored fewer kicks (1 = scored)', () => {
        // NLD vs MAR: home scored 2, away scored 3 → home (NLD) lost.
        expect(
            getPenaltyShootoutLoser({
                home: [1, 2, 1, 2, 2],
                away: [2, 1, 1, 2, 1],
            }),
        ).toBe('home');
    });

    it('handles >5 kicks per side (6-each shootout decided in sudden death)', () => {
        expect(
            getPenaltyShootoutLoser({
                home: [1, 1, 1, 1, 1, 2],
                away: [1, 1, 1, 1, 1, 1],
            }),
        ).toBe('home');
    });

    it('returns undefined when both sides scored equally (not yet decided)', () => {
        expect(getPenaltyShootoutLoser({ home: [1, 1], away: [1, 1] })).toBeUndefined();
    });
});

describe('getLoser', () => {
    const drawnScores = [{ score: [1, 1] }];

    it('prefers an explicit non-draw winResult over scores/penalties', () => {
        expect(getLoser(0, [{ score: [1, 2] }], { home: [1], away: [1, 1] })).toBe('away');
        expect(getLoser(2, [{ score: [2, 1] }], { home: [1, 1], away: [1] })).toBe('home');
    });

    it('falls back to penalty kicks when winResult is a draw (1)', () => {
        expect(getLoser(1, drawnScores, { home: [1, 2, 1, 2, 2], away: [2, 1, 1, 2, 1] })).toBe('home');
    });

    it('falls back to penalty kicks when regulation scores are tied and winResult is unset', () => {
        expect(getLoser(undefined, drawnScores, { home: [1, 1], away: [1, 1, 1] })).toBe('home');
    });

    it('mutes nobody for a drawn league match with no shootout', () => {
        expect(getLoser(1, drawnScores, undefined)).toBeUndefined();
        expect(getLoser(undefined, drawnScores, undefined)).toBeUndefined();
    });
});

const HOME_TEAM = { name: 'Cavaliers', abbreviation: 'CLE', color: '#860038' };
const AWAY_TEAM = { name: 'Pistons', abbreviation: 'DET', color: '#1D42BA' };

function makeOutcome(id: string, label: string, price = '0.5'): BetsMarketOutcome {
    return { id, label, price };
}

function makeMarket(overrides: Partial<BetsMarketDataForUI>): BetsMarketDataForUI {
    return {
        id: 'm1',
        conditionId: 'c1',
        questionId: 'q1',
        title: 'Test',
        volume: '0',
        isResolved: false,
        isClosed: false,
        createTime: 0,
        outcomes: [],
        ...overrides,
    };
}

function makeCtx(overrides: Partial<ResolvedSportOutcomeContext> = {}): ResolvedSportOutcomeContext {
    return {
        scores: [{ score: [0, 0] }],
        homeTeam: HOME_TEAM,
        awayTeam: AWAY_TEAM,
        ...overrides,
    };
}

describe('getResolvedSportOutcome', () => {
    describe('formal / price resolution (all market types)', () => {
        it('uses formal resolvedOutcomeId when present', () => {
            const market = makeMarket({
                outcomes: [makeOutcome('home', 'Cavaliers'), makeOutcome('away', 'Pistons')],
                resolvedOutcomeId: 'away',
            });
            const result = getResolvedSportOutcome(market, SportMarketGroupType.Moneyline, makeCtx());
            expect(result?.index).toBe(1);
            expect(result?.team?.name).toBe('Pistons');
        });

        it('falls back to a price decided at certainty (>= 1)', () => {
            const market = makeMarket({
                outcomes: [makeOutcome('home', 'Cavaliers', '1'), makeOutcome('away', 'Pistons', '0')],
            });
            const result = getResolvedSportOutcome(market, SportMarketGroupType.Moneyline, makeCtx());
            expect(result?.index).toBe(0);
            expect(result?.team?.name).toBe('Cavaliers');
        });

        it('prefers formal resolution over price-decided and scores', () => {
            const market = makeMarket({
                outcomes: [makeOutcome('home', 'Cavaliers', '1'), makeOutcome('away', 'Pistons', '0')],
                resolvedOutcomeId: 'away',
            });
            const result = getResolvedSportOutcome(market, SportMarketGroupType.Moneyline, makeCtx({ winResult: 0 }));
            expect(result?.index).toBe(1);
        });

        it('resolves Other (BTTS) markets via formal resolution', () => {
            const market = makeMarket({
                outcomes: [makeOutcome('yes', 'Yes'), makeOutcome('no', 'No')],
                resolvedOutcomeId: 'yes',
            });
            const result = getResolvedSportOutcome(market, SportMarketGroupType.Other, makeCtx());
            expect(result?.index).toBe(0);
        });
    });

    describe('moneyline (score math)', () => {
        const market = makeMarket({
            sportsMarketType: 'moneyline',
            outcomes: [makeOutcome('home', 'Cavaliers'), makeOutcome('away', 'Pistons')],
        });

        it('maps winResult 0 (home win) to the home outcome', () => {
            expect(
                getResolvedSportOutcome(market, SportMarketGroupType.Moneyline, makeCtx({ winResult: 0 }))?.team?.name,
            ).toBe('Cavaliers');
        });

        it('maps winResult 2 (away win) to the away outcome', () => {
            expect(
                getResolvedSportOutcome(market, SportMarketGroupType.Moneyline, makeCtx({ winResult: 2 }))?.team?.name,
            ).toBe('Pistons');
        });

        it('returns undefined for a draw (winResult 1) on a 2-way market', () => {
            expect(
                getResolvedSportOutcome(market, SportMarketGroupType.Moneyline, makeCtx({ winResult: 1 })),
            ).toBeUndefined();
        });

        it('resolves a 3-way moneyline draw to the Draw outcome (index 2)', () => {
            // mergeThreeWayMarketsOfType orders outcomes [home, away, draw]; a draw (winResult 1)
            // must surface the Draw outcome, not stay blank.
            const threeWay = makeMarket({
                sportsMarketType: 'moneyline',
                outcomes: [
                    makeOutcome('home', 'Cavaliers'),
                    makeOutcome('away', 'Pistons'),
                    makeOutcome('draw', 'Draw'),
                ],
            });
            const result = getResolvedSportOutcome(threeWay, SportMarketGroupType.Moneyline, makeCtx({ winResult: 1 }));
            expect(result?.index).toBe(2);
            expect(result?.team).toBeUndefined();
        });

        it('prefers winResult over a conflicting final score', () => {
            // winResult=2 (away win) but the scoreboard shows a home blowout — winResult is authoritative.
            const result = getResolvedSportOutcome(
                market,
                SportMarketGroupType.Moneyline,
                makeCtx({ winResult: 2, scores: [{ score: [5, 1] }] }),
            );
            expect(result?.team?.name).toBe('Pistons');
        });

        it('falls back to score comparison when winResult is unset', () => {
            const homeWin = getResolvedSportOutcome(
                market,
                SportMarketGroupType.Moneyline,
                makeCtx({ scores: [{ score: [3, 1] }] }),
            );
            expect(homeWin?.team?.name).toBe('Cavaliers');
            const awayWin = getResolvedSportOutcome(
                market,
                SportMarketGroupType.Moneyline,
                makeCtx({ scores: [{ score: [1, 3] }] }),
            );
            expect(awayWin?.team?.name).toBe('Pistons');
        });

        it('finds the winning team regardless of outcome order', () => {
            const reversed = makeMarket({
                sportsMarketType: 'moneyline',
                outcomes: [makeOutcome('a', 'Pistons'), makeOutcome('h', 'Cavaliers')],
            });
            const result = getResolvedSportOutcome(reversed, SportMarketGroupType.Moneyline, makeCtx({ winResult: 0 }));
            expect(result?.index).toBe(1);
            expect(result?.team?.name).toBe('Cavaliers');
        });

        it('returns undefined when no outcome matches the winning team label', () => {
            const unmatched = makeMarket({
                sportsMarketType: 'moneyline',
                outcomes: [makeOutcome('a', 'East'), makeOutcome('b', 'West')],
            });
            expect(
                getResolvedSportOutcome(unmatched, SportMarketGroupType.Moneyline, makeCtx({ winResult: 0 })),
            ).toBeUndefined();
        });
    });

    describe('spread (score math)', () => {
        const market = (line: number) =>
            makeMarket({
                sportsMarketType: 'spreads',
                slug: `cavaliers-pistons-spread-home-${String(line).replace('.', '_')}`,
                line,
                outcomes: [makeOutcome('h', 'Cavaliers'), makeOutcome('a', 'Pistons')],
            });

        it('picks the home team when the home side covers', () => {
            // signedLine (home perspective) = +3.5; 1 + 3.5 - 3 = 1.5 > 0 → home covers.
            const result = getResolvedSportOutcome(
                market(3.5),
                SportMarketGroupType.Spread,
                makeCtx({ scores: [{ score: [1, 3] }] }),
            );
            expect(result?.index).toBe(0);
            expect(result?.team?.name).toBe('Cavaliers');
        });

        it('picks the away team when the away side covers', () => {
            // signedLine = +3.5; 0 + 3.5 - 10 = -6.5 < 0 → away covers.
            const result = getResolvedSportOutcome(
                market(3.5),
                SportMarketGroupType.Spread,
                makeCtx({ scores: [{ score: [0, 10] }] }),
            );
            expect(result?.index).toBe(1);
            expect(result?.team?.name).toBe('Pistons');
        });

        it('returns undefined on a spread push (margin exactly 0)', () => {
            // signedLine = +3; 0 + 3 - 3 = 0 → push.
            const result = getResolvedSportOutcome(
                market(3),
                SportMarketGroupType.Spread,
                makeCtx({ scores: [{ score: [0, 3] }] }),
            );
            expect(result).toBeUndefined();
        });

        it('negates the line for an away-side slug (-spread-away-)', () => {
            // Away-side market: home perspective is -3.5. 1 + (-3.5) - 3 = -5.5 < 0 → away covers.
            const away = makeMarket({
                sportsMarketType: 'spreads',
                slug: 'cavaliers-pistons-spread-away-3_5',
                line: 3.5,
                outcomes: [makeOutcome('h', 'Cavaliers'), makeOutcome('a', 'Pistons')],
            });
            const result = getResolvedSportOutcome(
                away,
                SportMarketGroupType.Spread,
                makeCtx({ scores: [{ score: [1, 3] }] }),
            );
            expect(result?.index).toBe(1);
            expect(result?.team?.name).toBe('Pistons');
        });

        it('returns undefined when the slug has no -home-/-away- segment', () => {
            const noSide = makeMarket({
                sportsMarketType: 'spreads',
                slug: 'cavaliers-pistons-spread-3_5',
                line: 3.5,
                outcomes: [makeOutcome('h', 'Cavaliers'), makeOutcome('a', 'Pistons')],
            });
            expect(
                getResolvedSportOutcome(noSide, SportMarketGroupType.Spread, makeCtx({ scores: [{ score: [5, 1] }] })),
            ).toBeUndefined();
        });
    });

    describe('total (score math)', () => {
        const market = (line: number, labels: [string, string] = ['Over', 'Under']) =>
            makeMarket({
                sportsMarketType: 'totals',
                line,
                outcomes: [makeOutcome('over', labels[0]), makeOutcome('under', labels[1])],
            });

        it('picks Over when the combined score exceeds the line', () => {
            const result = getResolvedSportOutcome(
                market(2.5),
                SportMarketGroupType.Total,
                makeCtx({ scores: [{ score: [2, 1] }] }),
            );
            expect(result?.index).toBe(0);
        });

        it('picks Under when the combined score is below the line', () => {
            const result = getResolvedSportOutcome(
                market(2.5),
                SportMarketGroupType.Total,
                makeCtx({ scores: [{ score: [0, 0] }] }),
            );
            expect(result?.index).toBe(1);
        });

        it('matches the Over side regardless of outcome order', () => {
            // Outcomes ordered [Under, Over]; combined > line → Over wins (index 1), not index 0.
            const reversed = makeMarket({
                sportsMarketType: 'totals',
                line: 2.5,
                outcomes: [makeOutcome('u', 'Under'), makeOutcome('o', 'Over')],
            });
            const result = getResolvedSportOutcome(
                reversed,
                SportMarketGroupType.Total,
                makeCtx({ scores: [{ score: [3, 1] }] }),
            );
            expect(result?.index).toBe(1);
        });

        it('matches abbreviated Over/Under labels', () => {
            const over = getResolvedSportOutcome(
                market(2.5, ['O 2.5', 'U 2.5']),
                SportMarketGroupType.Total,
                makeCtx({ scores: [{ score: [3, 1] }] }),
            );
            expect(over?.index).toBe(0);
            const under = getResolvedSportOutcome(
                market(2.5, ['O 2.5', 'U 2.5']),
                SportMarketGroupType.Total,
                makeCtx({ scores: [{ score: [0, 0] }] }),
            );
            expect(under?.index).toBe(1);
        });

        it('returns undefined on a total push (combined equals line)', () => {
            const result = getResolvedSportOutcome(
                market(3),
                SportMarketGroupType.Total,
                makeCtx({ scores: [{ score: [2, 1] }] }),
            );
            expect(result).toBeUndefined();
        });

        it('returns undefined when the line is missing (cannot compare)', () => {
            const noLine = makeMarket({
                sportsMarketType: 'totals',
                outcomes: [makeOutcome('o', 'Over'), makeOutcome('u', 'Under')],
            });
            const result = getResolvedSportOutcome(
                noLine,
                SportMarketGroupType.Total,
                makeCtx({ scores: [{ score: [2, 1] }] }),
            );
            expect(result).toBeUndefined();
        });
    });

    describe('period / event markets (not score-derivable)', () => {
        it('returns undefined for a 1st-half moneyline even with a decisive full-game winResult', () => {
            // Home led at halftime but lost the game: full-game score math must not pick a winner.
            const firstHalf = makeMarket({
                sportsMarketType: 'first_half_moneyline',
                outcomes: [makeOutcome('home', 'Cavaliers'), makeOutcome('away', 'Pistons')],
            });
            expect(
                getResolvedSportOutcome(firstHalf, SportMarketGroupType.Moneyline, makeCtx({ winResult: 2 })),
            ).toBeUndefined();
        });

        it('returns undefined for a series game-winner (child_moneyline)', () => {
            const gameWinner = makeMarket({
                sportsMarketType: 'child_moneyline',
                outcomes: [makeOutcome('home', 'Cavaliers'), makeOutcome('away', 'Pistons')],
            });
            expect(
                getResolvedSportOutcome(gameWinner, SportMarketGroupType.Moneyline, makeCtx({ winResult: 0 })),
            ).toBeUndefined();
        });

        it('still resolves a period market via formal resolution', () => {
            const firstHalf = makeMarket({
                sportsMarketType: 'first_half_moneyline',
                outcomes: [makeOutcome('home', 'Cavaliers'), makeOutcome('away', 'Pistons')],
                resolvedOutcomeId: 'home',
            });
            expect(getResolvedSportOutcome(firstHalf, SportMarketGroupType.Moneyline, makeCtx())?.team?.name).toBe(
                'Cavaliers',
            );
        });
    });

    describe('full-game gate (sport-prefixed types admitted)', () => {
        // Soccer/tennis full-game variants carry a sport prefix in the feed and must reach score math.
        it('admits soccer_spreads to spread score math', () => {
            const market = makeMarket({
                sportsMarketType: 'soccer_spreads',
                slug: 'cle-det-spread-home-1_5',
                line: 1.5,
                outcomes: [makeOutcome('h', 'Cavaliers'), makeOutcome('a', 'Pistons')],
            });
            const result = getResolvedSportOutcome(
                market,
                SportMarketGroupType.Spread,
                makeCtx({ scores: [{ score: [3, 1] }] }),
            );
            expect(result?.team?.name).toBe('Cavaliers');
        });

        it('admits soccer_totals to total score math', () => {
            const market = makeMarket({
                sportsMarketType: 'soccer_totals',
                line: 2.5,
                outcomes: [makeOutcome('o', 'Over'), makeOutcome('u', 'Under')],
            });
            const result = getResolvedSportOutcome(
                market,
                SportMarketGroupType.Total,
                makeCtx({ scores: [{ score: [2, 1] }] }),
            );
            expect(result?.index).toBe(0);
        });

        it('admits tennis_moneyline to moneyline score math', () => {
            const market = makeMarket({
                sportsMarketType: 'tennis_moneyline',
                outcomes: [makeOutcome('h', 'Cavaliers'), makeOutcome('a', 'Pistons')],
            });
            const result = getResolvedSportOutcome(
                market,
                SportMarketGroupType.Moneyline,
                makeCtx({ scores: [{ score: [3, 1] }] }),
            );
            expect(result?.team?.name).toBe('Cavaliers');
        });

        it('still excludes soccer period variants (soccer_second_half_totals)', () => {
            const market = makeMarket({
                sportsMarketType: 'soccer_second_half_totals',
                line: 1.5,
                outcomes: [makeOutcome('o', 'Over'), makeOutcome('u', 'Under')],
            });
            expect(
                getResolvedSportOutcome(market, SportMarketGroupType.Total, makeCtx({ scores: [{ score: [2, 1] }] })),
            ).toBeUndefined();
        });
    });

    describe('other (not derivable from scores)', () => {
        it('returns undefined without formal/price resolution', () => {
            const market = makeMarket({
                outcomes: [makeOutcome('yes', 'Yes'), makeOutcome('no', 'No')],
            });
            expect(
                getResolvedSportOutcome(market, SportMarketGroupType.Other, makeCtx({ winResult: 0 })),
            ).toBeUndefined();
        });
    });
});
