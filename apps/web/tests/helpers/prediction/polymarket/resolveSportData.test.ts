import { describe, expect, it } from 'vitest';

import { resolveSportData } from '@/helpers/prediction/polymarket/resolveSportData.js';
import type { PolymarketEvent } from '@/providers/prediction/polymarket/type.js';
import { SportScoreType } from '@/types/prediction.js';

function baseEvent(overrides: Partial<PolymarketEvent> = {}): PolymarketEvent {
    return {
        id: 'event-1',
        slug: 'nba-cle-nyk-2026-05-21',
        title: 'Cavaliers vs. Knicks',
        gameId: 20023812,
        leagueName: 'NBA',
        tags: [
            { id: 'sports', label: 'Sports', slug: 'sports' },
            { id: 'nba', label: 'NBA', slug: 'nba' },
            { id: 'games', label: 'Games', slug: 'games' },
            { id: 'basketball', label: 'Basketball', slug: 'basketball' },
        ],
        markets: [
            {
                sportsMarketType: 'moneyline',
                outcomes: '["Cavaliers","Knicks"]',
                teams: [
                    { name: 'Cavaliers', abbreviation: 'CLE' },
                    { name: 'Knicks', abbreviation: 'NYK' },
                ],
            },
        ],
        ...overrides,
    } as PolymarketEvent;
}

describe('resolveSportData', () => {
    it('uses the event league tag instead of the generic sports tag', () => {
        expect(resolveSportData(baseEvent())?.leagueSlug).toBe('nba');
    });

    it('falls back to the first non-generic sport tag when the league name is unavailable', () => {
        expect(resolveSportData(baseEvent({ leagueName: undefined }))?.leagueSlug).toBe('nba');
    });

    it('prefers leagueId when tag order puts the sport before the league', () => {
        const result = resolveSportData(
            baseEvent({
                leagueId: 'mlb',
                leagueName: undefined,
                tags: [
                    {
                        id: 'sports',
                        label: 'Sports',
                        slug: 'sports',
                        forceShow: false,
                        publishedAt: '',
                        createdAt: '',
                        updatedAt: '',
                    },
                    {
                        id: 'baseball',
                        label: 'Baseball',
                        slug: 'baseball',
                        forceShow: false,
                        publishedAt: '',
                        createdAt: '',
                        updatedAt: '',
                    },
                    {
                        id: 'mlb',
                        label: 'MLB',
                        slug: 'mlb',
                        forceShow: false,
                        publishedAt: '',
                        createdAt: '',
                        updatedAt: '',
                    },
                ],
            }),
        );

        expect(result?.leagueSlug).toBe('mlb');
    });

    it('parses score string as fallback when score_show is empty', () => {
        const result = resolveSportData(baseEvent({ score: '1-1', score_show: [] }));
        expect(result?.scores).toEqual([{ score: [1, 1] }]);
        expect(result?.scoreType).toBe(SportScoreType.Single);
    });

    it('parses score string as fallback when score_show is undefined', () => {
        const result = resolveSportData(baseEvent({ score: '2-0' }));
        expect(result?.scores).toEqual([{ score: [2, 0] }]);
        expect(result?.scoreType).toBe(SportScoreType.Single);
    });

    it('prefers score_show over score string', () => {
        const result = resolveSportData(
            baseEvent({
                score: '0-0',
                score_show: [{ score: [3, 2] }],
            }),
        );
        expect(result?.scores).toEqual([{ score: [3, 2] }]);
    });

    it('returns empty scores when both score_show and score are absent', () => {
        const result = resolveSportData(baseEvent());
        expect(result?.scores).toEqual([]);
    });

    it('passes penaltyShootout through to SportEventData', () => {
        const result = resolveSportData(baseEvent({ penaltyShootout: { home: [1, 0], away: [2] } }));
        expect(result?.penaltyShootout).toEqual({ home: [1, 0], away: [2] });
    });

    it('leaves penaltyShootout undefined when absent', () => {
        const result = resolveSportData(baseEvent());
        expect(result?.penaltyShootout).toBeUndefined();
    });

    describe('ended detection fallbacks', () => {
        it('detects ended via gameStatus = "finished"', () => {
            const result = resolveSportData(baseEvent({ ended: false, gameStatus: 'finished' }));
            expect(result?.ended).toBe(true);
        });

        it('detects ended via gameStatus = "2"', () => {
            const result = resolveSportData(baseEvent({ ended: false, gameStatus: '2' }));
            expect(result?.ended).toBe(true);
        });

        it('detects ended via finishedTimestamp', () => {
            const result = resolveSportData(baseEvent({ ended: false, finishedTimestamp: '2026-05-21T22:00:00Z' }));
            expect(result?.ended).toBe(true);
        });

        it('does not mark as ended when gameStatus = "live"', () => {
            const result = resolveSportData(baseEvent({ ended: false, gameStatus: 'live' }));
            expect(result?.ended).toBe(false);
        });

        it('does not mark as ended when no signals present', () => {
            const result = resolveSportData(baseEvent({ ended: false }));
            expect(result?.ended).toBe(false);
        });

        it('explicit ended = true still works', () => {
            const result = resolveSportData(baseEvent({ ended: true }));
            expect(result?.ended).toBe(true);
        });

        it('detects ended via closed + winResult (ATP tennis fallback)', () => {
            const result = resolveSportData(baseEvent({ ended: false, closed: true, winResult: 0 }));
            expect(result?.ended).toBe(true);
        });

        it('does not mark as ended when closed but no winResult', () => {
            const result = resolveSportData(baseEvent({ ended: false, closed: true }));
            expect(result?.ended).toBe(false);
        });
    });

    describe('team resolution', () => {
        it('falls back to event-level teams when the market teams are null (e.g. UFC)', () => {
            const result = resolveSportData(
                baseEvent({
                    markets: [
                        { sportsMarketType: 'moneyline', outcomes: '["Sean Strickland","Khamzat Chimaev"]' },
                    ] as PolymarketEvent['markets'],
                    drawTeams: [],
                    teams: [
                        { name: 'Sean Strickland', logo: 'https://example.com/sean.png' },
                        { name: 'Khamzat Chimaev', logo: 'https://example.com/khamzat.png' },
                    ],
                }),
            );
            expect(result?.homeTeam.logo).toBe('https://example.com/sean.png');
            expect(result?.awayTeam.logo).toBe('https://example.com/khamzat.png');
        });

        it('prefers per-market teams over event-level teams', () => {
            const result = resolveSportData(
                baseEvent({
                    markets: [
                        {
                            sportsMarketType: 'moneyline',
                            outcomes: '["Cavaliers","Knicks"]',
                            teams: [
                                { name: 'Cavaliers', logo: 'https://example.com/cle.png' },
                                { name: 'Knicks', logo: 'https://example.com/nyk.png' },
                            ],
                        },
                    ] as PolymarketEvent['markets'],
                    teams: [
                        { name: 'Wrong', logo: 'https://example.com/wrong-home.png' },
                        { name: 'Wrong', logo: 'https://example.com/wrong-away.png' },
                    ],
                }),
            );
            expect(result?.homeTeam.logo).toBe('https://example.com/cle.png');
            expect(result?.awayTeam.logo).toBe('https://example.com/nyk.png');
        });
    });
});
