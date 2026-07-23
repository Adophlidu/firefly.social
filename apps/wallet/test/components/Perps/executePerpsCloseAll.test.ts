import { describe, expect, it, vi } from 'vitest';

import { executePerpsCloseAll, PerpsPartialSuccessError } from '@/components/Perps/executePerpsCloseAll.js';

describe('executePerpsCloseAll', () => {
    it('cancels opening orders before closing positions and reduce-only orders afterward', async () => {
        const calls: string[] = [];

        await executePerpsCloseAll({
            cancelOpeningOrders: vi.fn(async () => {
                calls.push('opening');
            }),
            closePositions: vi.fn(async () => {
                calls.push('positions');
            }),
            cancelReduceOnlyOrders: vi.fn(async () => {
                calls.push('reduce-only');
            }),
        });

        expect(calls).toEqual(['opening', 'positions', 'reduce-only']);
    });

    it('reports partial success when opening orders were canceled but closing positions fails', async () => {
        const failure = executePerpsCloseAll({
            cancelOpeningOrders: vi.fn().mockResolvedValue(undefined),
            closePositions: vi.fn().mockRejectedValue(new Error('close failed')),
        });

        await expect(failure).rejects.toBeInstanceOf(PerpsPartialSuccessError);
        await expect(failure).rejects.toThrow('Open orders were canceled');
    });

    it('preserves the original close error when no preceding action succeeded', async () => {
        const closeError = new Error('close failed');
        const failure = executePerpsCloseAll({
            closePositions: vi.fn().mockRejectedValue(closeError),
        });

        await expect(failure).rejects.toBe(closeError);
    });
});
