/**
 * Cross-locale regression tests for sport-market classification/grouping.
 *
 * The sport-detail API translates `groupItemTitle` per locale (en / zh / zh-hant / es / ja),
 * and translations are messy — even one player's lines can mix languages and colon widths.
 * Every classifier here must be locale-invariant, driven by the slug + numeric `line`, so the
 * SAME logical market yields the SAME result in every locale.
 *
 * Title fixtures below are real values captured from the API for event
 * fifwc-qat-che-2026-06-13 (slug + line are identical across locales).
 */
import { PredictionPlatform } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import { extractPlayerName, extractTeamName, playerGroupKey } from '@/helpers/prediction/sportMarketTabs.js';
import { formatPolymarketEvent, mergeSportGroupedMarkets } from '@/providers/firefly/prediction/formatEvents.js';
import type {
    PolymarketEvent,
    PolymarketMarket,
    PolymarketSportDetail,
    PolymarketSportGroupedMarket,
    PolymarketSportGroupedMarketItem,
} from '@/providers/prediction/polymarket/type.js';
import type { BetsEventDataForUI, BetsMarketDataForUI, SportTeam } from '@/types/prediction.js';

const LOCALES = ['en', 'zh', 'zh-hant', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

const FIRST_TO_SCORE: Record<Locale, { home: string; away: string; neither: string }> = {
    en: { home: 'Qatar', away: 'Switzerland', neither: 'Neither' },
    zh: { home: '卡塔尔', away: '瑞士', neither: '两者都不' },
    'zh-hant': { home: 'Qatar', away: 'Switzerland', neither: 'Neither' },
    es: { home: 'Catar', away: 'Suiza', neither: 'Ninguno' },
    ja: { home: 'カタール', away: 'スイス', neither: 'どちらでもない' },
};

const TEAM_TOTALS: Record<Locale, { home: string; away: string }> = {
    en: { home: 'Qatar O/U 0.5', away: 'Switzerland O/U 0.5' },
    zh: { home: '卡塔尔 大/小 0.5', away: '瑞士 大/小 0.5' },
    'zh-hant': { home: 'Qatar O/U 0.5', away: 'Switzerland O/U 0.5' },
    es: { home: 'Catar O/U 0.5', away: 'Suiza O/U 0.5' },
    ja: { home: 'Qatar O/U 0.5', away: 'Switzerland O/U 0.5' },
};

// [gte1, gte2, gte3] — note the within-locale messiness (mixed language + colon width).
const EMBolo_GOALS: Record<Locale, [string, string, string]> = {
    en: ['Breel Embolo: 1+ goals', 'Breel Embolo: 2+ goals', 'Breel Embolo: 3+ goals'],
    zh: ['Breel Embolo: 1+ 进球', 'Breel Embolo: 2+ 进球', '布雷尔·恩博洛：3+ 进球'],
    'zh-hant': ['Breel Embolo: 1+ goals', 'Breel Embolo: 2+ goals', 'Breel Embolo: 3+ goals'],
    es: ['Breel Embolo: 1+ goles', 'Breel Embolo: 2+ goles', 'Breel Embolo: 3+ goles'],
    ja: ['Breel Embolo: 1+ goals', 'ブレール・エンボロ: 2+ ゴール', 'Breel Embolo: 3+ goals'],
};

const homeTeam: SportTeam = { name: 'Qatar', abbreviation: 'qat', color: '#96173D' };
const awayTeam: SportTeam = { name: 'Switzerland', abbreviation: 'che', color: '#DA291C' };

function mk(overrides: Partial<BetsMarketDataForUI>): BetsMarketDataForUI {
    return {
        id: 'id',
        conditionId: 'cond',
        questionId: 'id',
        title: '',
        volume: '0',
        isResolved: false,
        isClosed: false,
        createTime: 0,
        outcomes: [],
        ...overrides,
    };
}

function binaryItem(groupItemTitle: string, yesPrice: string, suffix: string): PolymarketSportGroupedMarketItem {
    return {
        id: `${suffix}-id`,
        slug: `${suffix}-slug`,
        conditionId: `${suffix}-cond`,
        groupItemTitle,
        outcomes: ['Yes', 'No'],
        outcomePrices: [yesPrice, String(1 - Number(yesPrice))],
        clobTokenIds: [`${suffix}-yes`, `${suffix}-no`],
        volumeClob: 1000,
    };
}

function buildSportDetail(
    types: Array<{ type: string; items: PolymarketSportGroupedMarketItem[] }>,
): PolymarketSportDetail {
    const groupedMarkets: PolymarketSportGroupedMarket[] = types.map(({ type, items }) => ({
        sportsMarketType: type,
        markets: items,
    }));
    return { slug: 'fifwc-qat-che-2026-06-13', groupedMarkets };
}

function buildEvent(): BetsEventDataForUI {
    return {
        id: 'event-1',
        title: 'Qatar vs. Switzerland',
        endTime: 0,
        isSingleEvent: false,
        platform: PredictionPlatform.Polymarket,
        status: 'active',
        volume: '0',
        markets: [],
        sportData: {
            gameId: 351719,
            live: false,
            ended: false,
            homeTeam,
            awayTeam,
            scores: [],
            scoreType: 0,
            isDraw: true,
        },
    };
}

/** Minimal Gamma (PolymarketEvent) market with required fields pre-filled. */
function gammaMarket(overrides: Partial<PolymarketMarket>): PolymarketMarket {
    return {
        id: 'm-id',
        question: '',
        conditionId: 'cond',
        slug: '',
        endDate: '',
        createdAt: '',
        liquidity: '0',
        image: '',
        icon: '',
        description: '',
        outcomes: '[]',
        outcomePrices: '[]',
        volume: '0',
        active: true,
        closed: false,
        new: false,
        negRisk: false,
        umaResolutionStatus: '',
        umaResolutionStatuses: '[]',
        groupItemTitle: '',
        groupItemThreshold: '0',
        clobTokenIds: '[]',
        oneDayPriceChange: '0',
        oneWeekPriceChange: '0',
        events: [],
        orderPriceMinTickSize: '0',
        ...overrides,
    };
}

/** Minimal Gamma event wrapping the given markets. */
function gammaEvent(markets: PolymarketMarket[]): PolymarketEvent {
    return {
        id: 'e-id',
        slug: LOL_SLUG,
        title: 'LoL',
        description: '',
        startDate: '',
        creationDate: '',
        endDate: '',
        image: '',
        icon: '',
        active: true,
        closed: false,
        archived: false,
        new: false,
        liquidity: '0',
        volume: '0',
        openInterest: '0',
        createdAt: '',
        updatedAt: '',
        negRisk: false,
        sortBy: '',
        markets,
        series: [],
        tags: [],
    };
}

describe('sport-market classification is locale-invariant', () => {
    describe.each(LOCALES)('locale %s', (locale) => {
        it('merges first-to-score into one 3-outcome market from translated binary markets', () => {
            const t = FIRST_TO_SCORE[locale];
            const detail = buildSportDetail([
                {
                    type: 'soccer_first_to_score',
                    items: [
                        { ...binaryItem(t.home, '0.16', 'qat'), slug: 'e-first-to-score-home' },
                        { ...binaryItem(t.away, '0.805', 'che'), slug: 'e-first-to-score-away' },
                        { ...binaryItem(t.neither, '0.0465', 'neither'), slug: 'e-first-to-score-neither' },
                    ],
                },
            ]);

            const result = mergeSportGroupedMarkets(buildEvent(), detail);
            const merged = result.markets.filter((m) => m.sportsMarketType === 'soccer_first_to_score');

            expect(merged).toHaveLength(1);
            expect(merged[0].outcomes).toHaveLength(3);
            // Home/away render via abbreviation; the middle keeps the localized "neither" title.
            expect(merged[0].outcomes.map((o) => o.label)).toEqual(['QAT', 'CHE', t.neither]);
            expect(merged[0].outcomes.map((o) => o.price)).toEqual(['0.16', '0.805', '0.0465']);
        });

        it('resolves team-totals home/away from the slug regardless of the translated title', () => {
            const t = TEAM_TOTALS[locale];
            expect(extractTeamName(mk({ slug: 'e-team-total-home-0pt5', title: t.home }), homeTeam, awayTeam)).toBe(
                'Qatar',
            );
            expect(extractTeamName(mk({ slug: 'e-team-total-away-0pt5', title: t.away }), homeTeam, awayTeam)).toBe(
                'Switzerland',
            );
        });

        it('groups a player’s gte1/2/3 lines to one key despite messy translated titles', () => {
            const titles = EMBolo_GOALS[locale];
            const base = 'e-goals-breel-embolo';
            const keys = titles.map((title, i) => playerGroupKey(mk({ slug: `${base}-gte${i + 1}`, title })));

            // All three lines collapse to a single group → one card with a line switcher.
            expect(new Set(keys).size).toBe(1);
            // Display name strips the threshold suffix for both half- and full-width colons
            // (zh gte3 uses "：", ja gte2 uses ":").
            expect(extractPlayerName(mk({ title: titles[0] }))).toBe('Breel Embolo');
        });
    });
});

// Real fixtures from the LoL sport-detail API (event lol-ly-tsw-2026-07-08). The backend
// translates groupItemTitle per locale but keeps the slug English with a "-gameN-" segment,
// and eventSlugs only carries the series slug — so per-game tab routing must come from the item
// slug, not the localized title. The "-gameN-" form (no dash before the digit) is what Polymarket
// actually emits; the regex must tolerate it as well as "-game-N-".
const LOL_SLUG = 'lol-ly-tsw-2026-07-08';

function lolItem(type: string, gameNum: number, groupItemTitle: string): PolymarketSportGroupedMarketItem {
    return {
        id: `${type}-game${gameNum}-id`,
        slug: `${LOL_SLUG}-game${gameNum}-${type.replace(/_/g, '-')}`,
        eventSlug: LOL_SLUG,
        groupItemTitle,
        outcomes: ['是', '否'],
        outcomePrices: ['0.5', '0.5'],
        clobTokenIds: [`${type}-a`, `${type}-b`],
        volumeClob: 1000,
    };
}

describe('esports per-game routing is locale-invariant (slug-driven)', () => {
    it.each([
        ['en', 'First Blood in Game 4?'],
        ['zh', '游戏4一血？'],
    ])('prefixes per-game types from the slug, not the %s groupItemTitle', (_locale, firstBloodTitle) => {
        const detail: PolymarketSportDetail = {
            slug: LOL_SLUG,
            // Backend returns only the series slug → slugToGameNumber map is empty, so routing
            // falls to the item slug (locale-independent), not the localized title.
            eventSlugs: [LOL_SLUG],
            groupedMarkets: [
                { sportsMarketType: 'first_blood_game', markets: [lolItem('first_blood_game', 4, firstBloodTitle)] },
                {
                    sportsMarketType: 'kill_over_under_game',
                    markets: [lolItem('kill_over_under_game', 4, '第四局总击杀数大于/小于33.5？')],
                },
                {
                    sportsMarketType: 'lol_odd_even_total_kills',
                    markets: [lolItem('lol_odd_even_total_kills', 1, '总击杀数奇/偶')],
                },
            ],
        };

        const result = mergeSportGroupedMarkets(buildEvent(), detail);
        const types = result.markets.map((m) => m.sportsMarketType);

        // Identical prefixes in en and zh — driven by the slug, not the localized title.
        expect(types).toContain('game_4_first_blood_game');
        expect(types).toContain('game_4_kill_over_under_game');
        expect(types).toContain('game_1_lol_odd_even_total_kills');
        // Bare (un-prefixed) types must NOT leak into the default tab.
        expect(types).not.toContain('first_blood_game');
        expect(types).not.toContain('lol_odd_even_total_kills');
    });

    it('derives the child_moneyline line from the slug when the title is localized (zh)', () => {
        const itemId = 'cm-game1-id';
        const detail: PolymarketSportDetail = {
            slug: LOL_SLUG,
            eventSlugs: [LOL_SLUG],
            groupedMarkets: [
                {
                    sportsMarketType: 'child_moneyline',
                    markets: [
                        {
                            id: itemId,
                            slug: `${LOL_SLUG}-game1`,
                            eventSlug: LOL_SLUG,
                            groupItemTitle: '第一局胜者',
                            outcomes: ['里昂', '秘密鲸鱼队'],
                            outcomePrices: ['0.5', '0.5'],
                            clobTokenIds: ['cm-a', 'cm-b'],
                            volumeClob: 1000,
                        },
                    ],
                },
            ],
        };
        // Phase 2 matches the Gamma market by id and applies the slug-derived line.
        const event = { ...buildEvent(), markets: [mk({ id: itemId, sportsMarketType: 'child_moneyline' })] };

        const result = mergeSportGroupedMarkets(event, detail);
        const cm = result.markets.find((m) => m.sportsMarketType === 'child_moneyline');
        expect(cm).toBeDefined();
        // Line switcher shows "1", not "0".
        expect(cm?.line).toBe(1);
    });

    it('derives the child_moneyline line from groupItemTitleEn when the slug has no game number', () => {
        // Slug carries no game number and groupItemTitle is translated — the switcher must still
        // read "1"/"2" via the English groupItemTitleEn.
        const itemId = 'cm-jdg-game1-id';
        const detail: PolymarketSportDetail = {
            slug: LOL_SLUG,
            eventSlugs: [LOL_SLUG],
            groupedMarkets: [
                {
                    sportsMarketType: 'child_moneyline',
                    markets: [
                        {
                            id: itemId,
                            slug: `${LOL_SLUG}-jdg-vs-al`, // no -gameN- segment
                            eventSlug: LOL_SLUG,
                            groupItemTitle: '第一局胜者',
                            groupItemTitleEn: 'Game 1 Winner',
                            outcomes: ['JDG', "Anyone's Legend"],
                            outcomePrices: ['0.505', '0.495'],
                            clobTokenIds: ['cm-a', 'cm-b'],
                            volumeClob: 85700,
                        },
                    ],
                },
            ],
        };
        const event = { ...buildEvent(), markets: [mk({ id: itemId, sportsMarketType: 'child_moneyline' })] };

        const result = mergeSportGroupedMarkets(event, detail);
        const cm = result.markets.find((m) => m.sportsMarketType === 'child_moneyline');
        // Line switcher shows "1" — parsed from groupItemTitleEn, not the translated title.
        expect(cm?.line).toBe(1);
    });
});

describe('formatPolymarketEvent — series types are never game-prefixed', () => {
    // Real Gamma fixtures from lol-ly-tsw-2026-07-08. child_moneyline's slug carries "-gameN-" but
    // it is a SERIES type → must stay un-prefixed so it merges into one Series Lines section with a
    // line switcher (matching Polymarket), not split into "Game N 第 N 局胜者" per-game tabs.
    it('keeps child_moneyline un-prefixed even though its slug contains -gameN-', () => {
        const event = gammaEvent([
            gammaMarket({
                id: 'cm-game1',
                sportsMarketType: 'child_moneyline',
                slug: `${LOL_SLUG}-game1`,
                question: 'LoL: LYON vs Team Secret Whales - Game 1 Winner',
                groupItemTitle: 'Game 1 Winner',
            }),
            gammaMarket({
                id: 'fb-game4',
                sportsMarketType: 'first_blood_game',
                slug: `${LOL_SLUG}-game4-first-blood`,
                question: 'LoL: LYON vs Team Secret Whales - Game 4 First Blood',
                groupItemTitle: 'First Blood in Game 4?',
            }),
        ]);

        const result = formatPolymarketEvent(event);
        const types = result.markets.map((m) => m.sportsMarketType);

        // child_moneyline stays un-prefixed → one Series Lines section with a line switcher.
        expect(types).toContain('child_moneyline');
        expect(types).not.toContain('game_1_child_moneyline');
        // Per-game fun types ARE still prefixed from the slug.
        expect(types).toContain('game_4_first_blood_game');
    });
});
