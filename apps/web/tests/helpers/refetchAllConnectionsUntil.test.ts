import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockGetAllConnectionsFormatted = vi.fn();
const mockSetQueryData = vi.fn();
const mockRefetchQueries = vi.fn();

vi.mock('@dimensiondev/utils', () => ({
    delay: () => Promise.resolve(),
}));

vi.mock('@/configs/queryClient.js', () => ({
    queryClient: {
        setQueryData: (...args: unknown[]) => mockSetQueryData(...args),
        refetchQueries: (...args: unknown[]) => mockRefetchQueries(...args),
    },
}));

vi.mock('@/helpers/queryMyAllConnections.js', () => ({
    queryMyAllConnections: { queryKey: ['allConnections'] },
}));

vi.mock('@/providers/firefly/endpoint/getAllConnectionsFormatted.js', () => ({
    getAllConnectionsFormatted: (...args: unknown[]) => mockGetAllConnectionsFormatted(...args),
}));

import { refetchAllConnectionsUntil } from '@/helpers/refetchAllConnectionsUntil.js';

// Minimal AllConnectionsData shaped for the predicates under test.
const data = (addresses: string[]) => ({ connected: addresses.map((address) => ({ address })) }) as never;

const includes = (address: string) => (d: { connected: { address: string }[] }) =>
    d.connected.some((c) => c.address === address);

describe('refetchAllConnectionsUntil', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('syncs the cache and stops once the read is fresh', async () => {
        mockGetAllConnectionsFormatted.mockResolvedValue(data(['0x1']));

        await refetchAllConnectionsUntil(includes('0x1'));

        expect(mockGetAllConnectionsFormatted).toHaveBeenCalledTimes(1);
        expect(mockSetQueryData).toHaveBeenCalledWith(['allConnections'], data(['0x1']));
        expect(mockRefetchQueries).not.toHaveBeenCalled();
    });

    test('retries until the read reflects the change', async () => {
        mockGetAllConnectionsFormatted
            .mockResolvedValueOnce(data([]))
            .mockResolvedValueOnce(data([]))
            .mockResolvedValueOnce(data(['0x1']));

        await refetchAllConnectionsUntil(includes('0x1'));

        expect(mockGetAllConnectionsFormatted).toHaveBeenCalledTimes(3);
        expect(mockSetQueryData).toHaveBeenCalledWith(['allConnections'], data(['0x1']));
        expect(mockRefetchQueries).not.toHaveBeenCalled();
    });

    test('falls back to a plain refetch when never fresh within maxRetries', async () => {
        mockGetAllConnectionsFormatted.mockResolvedValue(data([]));

        await refetchAllConnectionsUntil(includes('0x1'), { maxRetries: 2 });

        expect(mockGetAllConnectionsFormatted).toHaveBeenCalledTimes(2);
        expect(mockSetQueryData).not.toHaveBeenCalled();
        expect(mockRefetchQueries).toHaveBeenCalledWith({ queryKey: ['allConnections'] });
    });
});
