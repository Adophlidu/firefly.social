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
import { mergeSportGroupedMarkets } from '@/providers/firefly/prediction/formatEvents.js';
import type {
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
