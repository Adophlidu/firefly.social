import { delay } from '@dimensiondev/utils';

import { queryClient } from '@/configs/queryClient.js';
import { queryMyAllConnections } from '@/helpers/queryMyAllConnections.js';
import { getAllConnectionsFormatted } from '@/providers/firefly/endpoint/getAllConnectionsFormatted.js';

type AllConnectionsData = Awaited<ReturnType<typeof getAllConnectionsFormatted>>;

/**
 * `/v1/accountConnection` lags the bind/disconnect write, so poll until `isFresh`
 * holds before syncing the cache. The cache is left untouched while polling, so
 * the caller's optimistic update stays visible; it's only updated once the read
 * reflects the change. Falls back to a plain refetch if it never catches up.
 */
export async function refetchAllConnectionsUntil(
    isFresh: (data: AllConnectionsData) => boolean,
    { intervalMs = 1000, maxRetries = 5 }: { intervalMs?: number; maxRetries?: number } = {},
): Promise<void> {
    for (let i = 0; i < maxRetries; i += 1) {
        await delay(intervalMs);
        const fresh = await getAllConnectionsFormatted();
        if (isFresh(fresh)) {
            queryClient.setQueryData(queryMyAllConnections.queryKey, fresh);
            return;
        }
    }

    await queryClient.refetchQueries({ queryKey: queryMyAllConnections.queryKey });
}
