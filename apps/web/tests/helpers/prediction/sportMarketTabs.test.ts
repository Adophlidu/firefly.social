import { describe, expect, it } from 'vitest';

import {
    extractPlayerName,
    extractSetNumber,
    extractTeamName,
    parseGameNumberFromQuestion,
    playerGroupKey,
    teamTotalsPeriod,
} from '@/helpers/prediction/sportMarketTabs.js';
import type { BetsMarketDataForUI, SportTeam } from '@/types/prediction.js';

const homeTeam: SportTeam = { name: 'Qatar', abbreviation: 'qat', color: '#96173D' };
const awayTeam: SportTeam = { name: 'Switzerland', abbreviation: 'che', color: '#DA291C' };

/** Build a BetsMarketDataForUI with required fields pre-filled; override what matters. */
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

describe('extractTeamName — locale-independent team resolution', () => {
    const market = (slug: string | undefined, groupItemTitle: string) =>
        mk({ slug, groupItemTitle, title: groupItemTitle });

    it('resolves home/away from the slug side regardless of (inconsistent) zh titles', () => {
        expect(
            extractTeamName(
                market('fifwc-qat-che-2026-06-13-team-total-home-0pt5', '卡塔尔 大/小 0.5'),
                homeTeam,
                awayTeam,
            ),
        ).toBe('Qatar');
        expect(
            extractTeamName(
                market('fifwc-qat-che-2026-06-13-team-total-home-1pt5', '卡塔尔 O/U 1.5'),
                homeTeam,
                awayTeam,
            ),
        ).toBe('Qatar');
        expect(
            extractTeamName(
                market('fifwc-qat-che-2026-06-13-team-total-home-2pt5', 'Qatar O/U 2.5'),
                homeTeam,
                awayTeam,
            ),
        ).toBe('Qatar');
        expect(
            extractTeamName(
                market('fifwc-qat-che-2026-06-13-team-total-away-2pt5', '瑞士 O/U 2.5'),
                homeTeam,
                awayTeam,
            ),
        ).toBe('Switzerland');
    });

    it('resolves team corners and half team-totals slugs', () => {
        expect(
            extractTeamName(
                market('fifwc-qat-che-2026-06-13-corners-team-home-1pt5', '卡塔尔角球: O/U 1.5'),
                homeTeam,
                awayTeam,
            ),
        ).toBe('Qatar');
        expect(
            extractTeamName(
                market('fifwc-qat-che-2026-06-13-corners-team-away-4pt5', '瑞士角球: O/U 4.5'),
                homeTeam,
                awayTeam,
            ),
        ).toBe('Switzerland');
        expect(
            extractTeamName(
                market('fifwc-qat-che-2026-06-13-second-half-team-total-home-1pt5', '卡塔尔 下半场 大/小 1.5'),
                homeTeam,
                awayTeam,
            ),
        ).toBe('Qatar');
    });

    it('falls back to the English title regex when the slug has no -home-/-away- segment', () => {
        expect(extractTeamName(market('some-event-team-totals-x', 'Argentina O/U 0.5'), homeTeam, awayTeam)).toBe(
            'Argentina',
        );
    });

    it('returns a stable "Home"/"Away" when teams are unavailable', () => {
        expect(extractTeamName(market('fifwc-qat-che-2026-06-13-team-total-home-0pt5', '卡塔尔 大/小 0.5'))).toBe(
            'Home',
        );
        expect(extractTeamName(market('fifwc-qat-che-2026-06-13-team-total-away-0pt5', '瑞士 大/小 0.5'))).toBe('Away');
    });
});

describe('parseGameNumberFromQuestion — locale-independent game/map number', () => {
    it('extracts the number from sportsMarketType', () => {
        expect(parseGameNumberFromQuestion(mk({ sportsMarketType: 'game_1_winner' }))).toBe(1);
        expect(parseGameNumberFromQuestion(mk({ sportsMarketType: 'map_2_handicap' }))).toBe(2);
        expect(parseGameNumberFromQuestion(mk({ sportsMarketType: 'round_handicap_game_3' }))).toBe(3);
        expect(parseGameNumberFromQuestion(mk({ sportsMarketType: 'game_4_lol_penta_kill' }))).toBe(4);
    });

    it('extracts the number from the slug when the type lacks it', () => {
        expect(
            parseGameNumberFromQuestion(
                mk({ sportsMarketType: 'lol_both_teams_baron', slug: 'series-game-2-lol-both-teams-baron' }),
            ),
        ).toBe(2);
    });

    it('falls back to the English question text', () => {
        expect(
            parseGameNumberFromQuestion(mk({ sportsMarketType: 'lol_first_blood', question: 'Game 1: First Blood?' })),
        ).toBe(1);
    });

    it('returns null when no signal is present', () => {
        expect(parseGameNumberFromQuestion(mk({ sportsMarketType: 'lol_penta_kill' }))).toBeNull();
    });

    it('does not match a type without a digit (no false positive)', () => {
        expect(parseGameNumberFromQuestion(mk({ sportsMarketType: 'game_winner' }))).toBeNull();
        expect(parseGameNumberFromQuestion(mk({ sportsMarketType: 'child_moneyline' }))).toBeNull();
    });
});

describe('extractSetNumber — locale-independent tennis set number', () => {
    it('extracts the set number from the slug', () => {
        expect(extractSetNumber(mk({ sportsMarketType: 'tennis_set_winner', slug: 'atp-match-set-2-winner' }))).toBe(2);
        expect(
            extractSetNumber(mk({ sportsMarketType: 'tennis_set_games_totals', slug: 'atp-match-set3-games' })),
        ).toBe(3);
    });

    it('falls back to the English question text', () => {
        expect(extractSetNumber(mk({ sportsMarketType: 'tennis_set_winner', question: 'Set 3 Winner' }))).toBe(3);
    });

    it('returns null when no signal is present', () => {
        expect(extractSetNumber(mk({ sportsMarketType: 'tennis_set_winner' }))).toBeNull();
    });
});

describe('playerGroupKey / extractPlayerName — merge a player’s prop lines (locale-independent)', () => {
    it('groups a player’s gte1/2/3 markets to one key, even with mixed-language messy titles', () => {
        const base = 'fifwc-qat-che-2026-06-13-goals-breel-embolo';
        expect(playerGroupKey(mk({ slug: `${base}-gte1`, title: 'Breel Embolo: 1+ 进球' }))).toBe(base);
        expect(playerGroupKey(mk({ slug: `${base}-gte2`, title: 'Breel Embolo: 2+ 进球' }))).toBe(base);
        expect(playerGroupKey(mk({ slug: `${base}-gte3`, title: '布雷尔·恩博洛：3+ 进球' }))).toBe(base);
    });

    it('keeps different players apart', () => {
        expect(playerGroupKey(mk({ slug: 'm-goals-dan-ndoye-gte1' }))).not.toBe(
            playerGroupKey(mk({ slug: 'm-goals-breel-embolo-gte1' })),
        );
    });

    it('falls back to the title-derived name when the slug lacks -gteN', () => {
        expect(playerGroupKey(mk({ slug: 'm-goals-dan-ndoye', title: '丹·恩多耶：1+ 进球' }))).toBe('丹·恩多耶');
    });

    it('extractPlayerName strips half-width and full-width colons', () => {
        expect(extractPlayerName(mk({ title: 'Breel Embolo: 1+ 进球' }))).toBe('Breel Embolo');
        expect(extractPlayerName(mk({ title: '丹·恩多耶：1+ 进球' }))).toBe('丹·恩多耶');
        expect(extractPlayerName(mk({ title: '丹·恩多耶' }))).toBe('丹·恩多耶');
    });
});

describe('teamTotalsPeriod — disambiguate 1H/2H team totals', () => {
    it('labels soccer first/second-half team totals as 1H/2H', () => {
        expect(teamTotalsPeriod('soccer_first_half_team_totals')).toBe('1H');
        expect(teamTotalsPeriod('soccer_second_half_team_totals')).toBe('2H');
    });

    it('labels basketball first-half team totals as 1H', () => {
        expect(teamTotalsPeriod('first_half_team_totals')).toBe('1H');
    });

    it('returns undefined for full-game team totals (no qualifier)', () => {
        expect(teamTotalsPeriod('team_totals')).toBeUndefined();
        expect(teamTotalsPeriod('soccer_team_totals')).toBeUndefined();
    });
});
