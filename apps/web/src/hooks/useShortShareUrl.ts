import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { buildDestinationUrl, parseLink } from '@dimensiondev/short-link';
import { NetworkError } from '@dimensiondev/utils';
import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';

import { FetchError } from '@/constants/error.js';
import { createShortlink, type ShortlinkRecord } from '@/providers/firefly/endpoint/createShortlink.js';

const MAX_CREATE_RETRIES = 2;

/**
 * Mutations don't retry by default (unlike queries). A single network blip or
 * transient 5xx would otherwise permanently fall back to the long URL for
 * this register() call — retry those, but bail immediately on 4xx (auth,
 * validation) since retrying can't fix a rejected request.
 */
function shouldRetryCreate(failureCount: number, error: unknown): boolean {
    if (failureCount >= MAX_CREATE_RETRIES) return false;
    if (error instanceof FetchError) return error.status >= 500;
    return error instanceof NetworkError;
}

export interface ShortShareUrl {
    /** The short link once the backend has created it; the input URL otherwise. */
    url: string;
    /** True while the short link is being created on the server — gate sharing/copying on this. */
    isPending: boolean;
    /**
     * Registers the short link with the backend and resolves to the created
     * short link, or the original long URL as a fallback (unsupported link
     * shape, feature disabled, or the create call failed). Safe to call
     * repeatedly — reuses the already-created link instead of registering
     * again.
     */
    register: () => Promise<string>;
}

/**
 * Registers a share URL as a Shortlink via the backend (`POST /v1/shortlinks`)
 * and returns the created short link. Unlike a client-computed hash, the code
 * is assigned by the server, so the short link isn't known until `register()`
 * resolves — callers that let the user share/copy the link should gate that
 * on `isPending` so a stale long URL never goes out while creation is still
 * in flight.
 *
 * Falls back to the input URL for link shapes short-link doesn't support (not
 * a recognized share-link shape) or while NEXT_PUBLIC_SHORT_LINK is disabled
 * — a shared link is always correct, short or not.
 */
export function useShortShareUrl(url: string): ShortShareUrl {
    const identity = url && envs.external.NEXT_PUBLIC_SHORT_LINK === STATUS.Enabled ? parseLink(url) : null;

    const mutation = useMutation({
        mutationFn: () => createShortlink(buildDestinationUrl(identity!)),
        retry: shouldRetryCreate,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 2000),
    });

    // Synchronous dedup guards, independent of when react-query re-renders with
    // the settled mutation state: a record cache (so a second register() after
    // the first resolved never re-registers) and an in-flight promise (so
    // concurrent calls share the same request instead of firing twice).
    const recordRef = useRef<ShortlinkRecord | null>(null);
    const pendingRef = useRef<Promise<ShortlinkRecord> | null>(null);

    const register = async (): Promise<string> => {
        if (!identity) return url;
        if (recordRef.current) return recordRef.current.shortlink;

        try {
            const promise = pendingRef.current ?? mutation.mutateAsync();
            pendingRef.current = promise;
            const result = await promise;
            recordRef.current = result;
            return result.shortlink;
        } catch {
            // Best-effort: the caller falls back to the long URL below.
            return url;
        } finally {
            pendingRef.current = null;
        }
    };

    return {
        url: recordRef.current?.shortlink ?? mutation.data?.shortlink ?? url,
        isPending: mutation.isPending,
        register,
    };
}
