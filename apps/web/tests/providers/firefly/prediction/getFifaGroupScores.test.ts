import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchJson } from '@/helpers/fetchJson.js';
import { getFifaGroupScores } from '@/providers/firefly/prediction/getFifaGroupScores.js';

vi.mock('@/helpers/fetchJson.js', () => ({
    fetchJson: vi.fn(),
}));

const mockedFetchJson = vi.mocked(fetchJson);

describe('getFifaGroupScores', () => {
    beforeEach(() => {
        mockedFetchJson.mockReset();
    });

    it('returns groups from the Firefly response', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            data: {
                groups: [
                    {
                        group_letter: 'A',
                        teams: [
                            {
                                country: 'Canada',
                                played: 1,
                                wins: 1,
                                draws: 0,
                                losses: 0,
                                points: 3,
                                advance_probability_percent: 56,
                            },
                        ],
                    },
                ],
            },
        });

        await expect(getFifaGroupScores()).resolves.toEqual({
            groups: [
                {
                    group_letter: 'A',
                    teams: [
                        expect.objectContaining({
                            country: 'Canada',
                            points: 3,
                            advance_probability_percent: 56,
                        }),
                    ],
                },
            ],
        });
        expect(mockedFetchJson).toHaveBeenCalledWith(expect.stringContaining('/v1/fifa/groups/score'), {
            method: 'GET',
        });
    });

    it('returns empty groups when response data is missing', async () => {
        mockedFetchJson.mockResolvedValueOnce({});

        await expect(getFifaGroupScores()).resolves.toEqual({ groups: [] });
    });
});
