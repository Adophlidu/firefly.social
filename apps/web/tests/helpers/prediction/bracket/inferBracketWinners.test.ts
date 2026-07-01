import { describe, expect, it } from 'vitest';

import { inferBracketWinners } from '@/helpers/prediction/category/bracket/inferBracketWinners.js';
import type {
    FifaBracketData,
    FifaBracketMatch,
    FifaBracketTeam,
} from '@/helpers/prediction/category/bracket/types.js';

function team(countryCode: string, name: string): FifaBracketTeam {
    return { countryCode, name, flagUrl: `https://example.com/${countryCode}.png`, teamColor: '#000000' };
}

function buildMatch(over: Partial<FifaBracketMatch> & Pick<FifaBracketMatch, 'id'>): FifaBracketMatch {
    return {
        roundId: 'r32',
        startTime: null,
        status: 'final',
        teams: [null, null],
        scores: null,
        percentages: null,
        marketSlugs: [null, null],
        eventSlug: null,
        feedsIntoMatchId: null,
        ...over,
    };
}

function dataOf(...matches: FifaBracketMatch[]): FifaBracketData {
    return {
        rounds: matches.reduce<FifaBracketData['rounds']>((acc, m) => {
            let round = acc.find((r) => r.id === m.roundId);
            if (!round) {
                round = { id: m.roundId, matches: [] };
                acc.push(round);
            }
            round.matches.push(m);
            return acc;
        }, []),
        updatedAt: null,
    };
}

describe('inferBracketWinners', () => {
    it('infers the advancing side for a finalized draw from the next-round match (NED 1–1 MAR)', () => {
        const data = dataOf(
            // r32-4 ended 1–1; Morocco won on penalties and reappears in r16-2.
            buildMatch({
                id: 'r32-4',
                roundId: 'r32',
                status: 'final',
                teams: [team('NED', 'Netherlands'), team('MAR', 'Morocco')],
                scores: [1, 1],
                feedsIntoMatchId: 'r16-2',
            }),
            buildMatch({
                id: 'r16-2',
                roundId: 'r16',
                status: 'upcoming',
                teams: [team('MAR', 'Morocco'), team('BRA', 'Brazil')],
                scores: null,
                feedsIntoMatchId: 'qf-1',
            }),
        );

        expect(inferBracketWinners(data).get('r32-4')).toBe(1);
    });

    it('returns side 0 when the first team is the one that advanced', () => {
        const data = dataOf(
            buildMatch({
                id: 'r32-4',
                status: 'final',
                teams: [team('NED', 'Netherlands'), team('MAR', 'Morocco')],
                scores: [2, 2],
                feedsIntoMatchId: 'r16-2',
            }),
            buildMatch({
                id: 'r16-2',
                roundId: 'r16',
                teams: [team('ARG', 'Argentina'), team('NED', 'Netherlands')],
                scores: null,
                feedsIntoMatchId: 'qf-1',
            }),
        );

        expect(inferBracketWinners(data).get('r32-4')).toBe(0);
    });

    it('omits decisive finals (handled by the card directly)', () => {
        const data = dataOf(
            buildMatch({
                id: 'r32-4',
                status: 'final',
                teams: [team('NED', 'Netherlands'), team('MAR', 'Morocco')],
                scores: [3, 1],
                feedsIntoMatchId: 'r16-2',
            }),
            buildMatch({
                id: 'r16-2',
                roundId: 'r16',
                teams: [team('NED', 'Netherlands'), team('BRA', 'Brazil')],
                scores: null,
                feedsIntoMatchId: 'qf-1',
            }),
        );

        expect(inferBracketWinners(data).has('r32-4')).toBe(false);
    });

    it('omits non-final matches (upcoming / live / tbd)', () => {
        const data = dataOf(
            buildMatch({
                id: 'r32-4',
                status: 'upcoming',
                teams: [team('NED', 'Netherlands'), team('MAR', 'Morocco')],
                scores: null,
                feedsIntoMatchId: 'r16-2',
            }),
        );

        expect(inferBracketWinners(data).has('r32-4')).toBe(false);
    });

    it('omits a finalized draw with no downstream match (e.g. the Final itself)', () => {
        const data = dataOf(
            buildMatch({
                id: 'final-0',
                roundId: 'final',
                status: 'final',
                teams: [team('ARG', 'Argentina'), team('FRA', 'France')],
                scores: [2, 2],
                feedsIntoMatchId: null,
            }),
        );

        expect(inferBracketWinners(data).has('final-0')).toBe(false);
    });

    it('omits a finalized draw when the downstream match has not been filled yet', () => {
        const data = dataOf(
            buildMatch({
                id: 'r32-4',
                status: 'final',
                teams: [team('NED', 'Netherlands'), team('MAR', 'Morocco')],
                scores: [1, 1],
                feedsIntoMatchId: 'r16-2',
            }),
            buildMatch({
                id: 'r16-2',
                roundId: 'r16',
                status: 'tbd',
                teams: [null, null],
                scores: null,
                feedsIntoMatchId: 'qf-1',
            }),
        );

        expect(inferBracketWinners(data).has('r32-4')).toBe(false);
    });

    it('omits a finalized draw when both teams appear downstream (ambiguous data)', () => {
        const data = dataOf(
            buildMatch({
                id: 'r32-4',
                status: 'final',
                teams: [team('NED', 'Netherlands'), team('MAR', 'Morocco')],
                scores: [1, 1],
                feedsIntoMatchId: 'r16-2',
            }),
            buildMatch({
                id: 'r16-2',
                roundId: 'r16',
                teams: [team('NED', 'Netherlands'), team('MAR', 'Morocco')],
                scores: null,
                feedsIntoMatchId: 'qf-1',
            }),
        );

        expect(inferBracketWinners(data).has('r32-4')).toBe(false);
    });

    it('omits a finalized draw whose downstream target does not exist', () => {
        const data = dataOf(
            buildMatch({
                id: 'r32-4',
                status: 'final',
                teams: [team('NED', 'Netherlands'), team('MAR', 'Morocco')],
                scores: [1, 1],
                feedsIntoMatchId: 'r16-99',
            }),
        );

        expect(inferBracketWinners(data).has('r32-4')).toBe(false);
    });

    it('falls back to the display name when country codes are missing', () => {
        const data = dataOf(
            buildMatch({
                id: 'r32-4',
                status: 'final',
                teams: [team('', 'Netherlands'), team('', 'Morocco')],
                scores: [1, 1],
                feedsIntoMatchId: 'r16-2',
            }),
            buildMatch({
                id: 'r16-2',
                roundId: 'r16',
                teams: [team('', 'Morocco'), team('', 'Brazil')],
                scores: null,
                feedsIntoMatchId: 'qf-1',
            }),
        );

        expect(inferBracketWinners(data).get('r32-4')).toBe(1);
    });

    it('returns an empty map when there are no rounds', () => {
        expect(inferBracketWinners({ rounds: [], updatedAt: null }).size).toBe(0);
    });
});
