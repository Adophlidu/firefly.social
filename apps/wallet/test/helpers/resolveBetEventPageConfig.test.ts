import { describe, expect, it } from 'vitest';

import { resolveBetEventPageConfig } from '@/helpers/resolveBetEventPageConfig.js';
import type { PolymarketEvent, PolymarketMarket } from '@/providers/types/Firefly.js';

function createMarket(overrides: Partial<PolymarketMarket> = {}): PolymarketMarket {
    return {
        conditionId: 'total-1',
        outcomes: '["Over","Under"]',
        groupItemThreshold: '',
        sportsMarketType: 'totals',
        ...overrides,
    } as PolymarketMarket;
}

function createEvent(overrides: Partial<PolymarketEvent> = {}): PolymarketEvent {
    return {
        isDraw: false,
        markets: [],
        ...overrides,
    } as PolymarketEvent;
}

describe('resolveBetEventPageConfig', () => {
    it('appends the line to Over/Under titles for a total market (e.g. "Over 2.5")', () => {
        const moneyline = createMarket({
            conditionId: 'ml-1',
            sportsMarketType: 'moneyline',
            teams: [
                { name: 'JD Gaming', abbreviation: 'JDG', color: '#fff' },
                { name: "Anyone's Legend", abbreviation: 'AL', color: '#000' },
            ],
        });
        const total = createMarket({
            conditionId: 'total-1',
            outcomes: '["Over","Under"]',
            question: 'Games Total: O/U 2.5',
            line: 2.5,
            groupItemThreshold: '',
        });
        const event = createEvent({ markets: [moneyline, total] });

        const config = resolveBetEventPageConfig(event, 'total-1');

        expect(config?.pageTitle).toBe('JD Gaming vs Anyone\'s Legend');
        expect(config?.marketName).toBe('Games Total');
        expect(config?.leftTitle).toBe('Over 2.5');
        expect(config?.rightTitle).toBe('Under 2.5');
    });

    it('appends the line to the localized outcome labels (zh: "大于 2.5")', () => {
        const total = createMarket({
            conditionId: 'total-1',
            sportsMarketType: 'totals',
            outcomes: '["大于","小于"]',
            question: '总局数：大小球 2.5',
            line: 2.5,
        });
        const event = createEvent({ markets: [total] });

        const config = resolveBetEventPageConfig(event, 'total-1');

        expect(config?.marketName).toBe('总局数');
        expect(config?.leftTitle).toBe('大于 2.5');
        expect(config?.rightTitle).toBe('小于 2.5');
    });

    it('does not treat odd/even "total kills" markets as Over/Under', () => {
        const oddEven = createMarket({
            conditionId: 'oe-1',
            sportsMarketType: 'lol_odd_even_total_kills',
            outcomes: '["Odd","Even"]',
            line: undefined,
        });
        const event = createEvent({ markets: [oddEven] });

        const config = resolveBetEventPageConfig(event, 'oe-1');

        expect(config).toEqual({ image: undefined, pageTitle: undefined, marketName: null });
    });

    it('formats integer lines without a trailing zero (3 -> "Over 3")', () => {
        const total = createMarket({ conditionId: 'total-1', line: 3 });
        const event = createEvent({ markets: [total] });

        const config = resolveBetEventPageConfig(event, 'total-1');

        expect(config?.leftTitle).toBe('Over 3');
        expect(config?.rightTitle).toBe('Under 3');
    });

    it('falls back to groupItemThreshold when line is missing', () => {
        const total = createMarket({ conditionId: 'total-1', line: undefined, groupItemThreshold: '4.5' });
        const event = createEvent({ markets: [total] });

        const config = resolveBetEventPageConfig(event, 'total-1');

        expect(config?.leftTitle).toBe('Over 4.5');
        expect(config?.rightTitle).toBe('Under 4.5');
    });

    it('leaves titles unset for an Over/Under market with no usable line', () => {
        const total = createMarket({ conditionId: 'total-1', line: undefined, groupItemThreshold: '' });
        const event = createEvent({ markets: [total] });

        const config = resolveBetEventPageConfig(event, 'total-1');

        // No teams and no line -> only image/pageTitle; caller shows the bare raw outcome.
        expect(config).toEqual({
            image: undefined,
            pageTitle: undefined,
            marketName: null,
        });
    });

    it('appends the handicap to spread titles, preferring team abbreviations ("LAL -3.5")', () => {
        const home = { name: 'Lakers', abbreviation: 'LAL', alias: 'LAL', color: '#gold' };
        const away = { name: 'Celtics', abbreviation: 'BOS', alias: 'BOS', color: '#green' };
        const spread = createMarket({
            conditionId: 'spread-1',
            sportsMarketType: 'spreads',
            outcomes: '["Lakers","Celtics"]',
            line: -3.5,
            teams: [home, away],
            question: 'Spreads: Lakers (-3.5) vs Celtics (+3.5)',
        });
        const moneyline = createMarket({
            conditionId: 'ml-1',
            sportsMarketType: 'moneyline',
            teams: [home, away],
        });
        const event = createEvent({ markets: [moneyline, spread] });

        const config = resolveBetEventPageConfig(event, 'spread-1');

        // outcome 0 takes the line's sign (-), outcome 1 the opposite (+)
        expect(config?.marketName).toBe('Spreads');
        expect(config?.leftTitle).toBe('LAL -3.5');
        expect(config?.rightTitle).toBe('BOS +3.5');
    });

    it('builds team + handicap labels for handicap markets with empty teams[] (zh)', () => {
        // LoL map_handicap ships outcomes as team names with teams: [] — team comes from the outcome.
        const handicap = createMarket({
            conditionId: 'hc-1',
            sportsMarketType: 'map_handicap',
            outcomes: '["任何人的传奇","JDG"]',
            line: -1.5,
            teams: [],
            question: '让球盘：AL (-1.5) vs JDG (+1.5)',
        });
        const event = createEvent({ markets: [handicap] });

        const config = resolveBetEventPageConfig(event, 'hc-1');

        expect(config?.marketName).toBe('让球盘');
        expect(config?.leftTitle).toBe('任何人的传奇 -1.5');
        expect(config?.rightTitle).toBe('JDG +1.5');
    });

    it('uses groupItemTitle as the market name for moneyline ("Match Winner")', () => {
        const home = { name: 'Lakers', abbreviation: 'LAL', alias: 'LAL', color: '#gold' };
        const away = { name: 'Celtics', abbreviation: 'BOS', alias: 'BOS', color: '#green' };
        const moneyline = createMarket({
            conditionId: 'ml-1',
            sportsMarketType: 'moneyline',
            outcomes: '["Lakers","Celtics"]',
            teams: [home, away],
            groupItemTitle: 'Match Winner',
        });
        const event = createEvent({ markets: [moneyline] });

        const config = resolveBetEventPageConfig(event, 'ml-1');

        expect(config?.marketName).toBe('Match Winner');
        expect(config?.leftTitle).toBe('LAL');
        expect(config?.rightTitle).toBe('BOS');
    });

    it('uses groupItemTitle as the market name for game-winner ("Game 2 Winner")', () => {
        const home = { name: 'JD Gaming', abbreviation: 'JDG', alias: 'JDG' };
        const away = { name: "Anyone's Legend", abbreviation: 'AL', alias: 'AL' };
        const gameWinner = createMarket({
            conditionId: 'gw-2',
            sportsMarketType: 'child_moneyline',
            outcomes: '["JD Gaming","Anyone\'s Legend"]',
            teams: [home, away],
            groupItemTitle: 'Game 2 Winner',
        });
        const moneyline = createMarket({
            conditionId: 'ml-1',
            sportsMarketType: 'moneyline',
            teams: [home, away],
        });
        const event = createEvent({ markets: [moneyline, gameWinner] });

        const config = resolveBetEventPageConfig(event, 'gw-2');

        expect(config?.marketName).toBe('Game 2 Winner');
    });
});
