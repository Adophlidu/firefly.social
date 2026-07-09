import { computeHash, formatShortLink, parseLink } from '@dimensiondev/short-link';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { registerShortLink } from '@/actions/registerShortLink.js';
import { STALE_TIMES } from '@/constants/query.js';

export interface ShortShareUrl {
    /** The short link once its hash is computed on the client; the input URL otherwise. */
    url: string;
    /** Fire-and-forget: registers the short link with the server. Never blocks or throws. */
    register: () => void;
}

/**
 * Computes a short link for a share URL (already carrying `?sid=` if
 * applicable) entirely on the client, via @dimensiondev/short-link's
 * deterministic hash — no server round trip needed to display it.
 *
 * Registration (the Redis write) is separate: call the returned `register()`
 * on user intent (e.g. the share button click). It runs in the background —
 * never awaited by the UI, errors are swallowed — since the short link is
 * already shown regardless of whether the write has landed yet.
 *
 * Falls back to the input URL for link shapes short-link doesn't support
 * (not a recognized post/profile link) — a shared link is always correct,
 * short or not.
 */
export function useShortShareUrl(url: string): ShortShareUrl {
    const identity = useMemo(() => (url ? parseLink(url) : null), [url]);

    const { data: hash } = useQuery({
        queryKey: ['short-link-hash', url],
        enabled: !!identity,
        staleTime: STALE_TIMES.INFINITY,
        queryFn: () => computeHash(identity!),
    });

    const register = useCallback(() => {
        if (!identity) return;
        void registerShortLink(url).catch(() => {
            // Best-effort background write; the client-computed short link above
            // is already shown to the user regardless of the outcome.
        });
    }, [identity, url]);

    return { url: hash ? formatShortLink(hash) : url, register };
}
