import { useEffect } from 'react';

/**
 * Refetch a query once an external readiness signal flips true.
 *
 * Used to fill in the viewer-relationship overlay (hasLiked, …) on a server-prefetched
 * (anonymous) list after the viewer's session has finished resuming. Two reasons this is an
 * effect rather than the obvious alternatives:
 * - `refetchOnMount` fires at mount, before the async session/provider client is ready, and
 *   would cache the anonymous result.
 * - Putting the signal in the query key would make a `useSuspenseQuery` list suspend and flash
 *   a loading state on change; refetching in place keeps the cached items on screen.
 */
export function useRefetchWhenReady(ready: boolean, refetch: () => void) {
    useEffect(() => {
        if (ready) refetch();
    }, [ready, refetch]);
}
