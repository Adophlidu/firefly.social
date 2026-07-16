import { buildDestinationUrl, parseLink } from '@dimensiondev/short-link';
import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

interface ShortlinkRecord {
    code: string;
    shortlink: string;
}

export interface ShortShareUrl {
    /** The short link once the backend has created it; the input URL otherwise. */
    url: string;
    /** True while the short link is being created on the server — gate sharing/copying on this. */
    isPending: boolean;
    /**
     * Registers the short link with the backend and resolves to the created short link, or the
     * original long URL as a fallback (unsupported link shape or the create call failed). Safe to
     * call repeatedly — reuses the already-created link instead of registering again.
     */
    register: () => Promise<string>;
}

/**
 * Wallet-side counterpart to apps/web's useShortShareUrl — registers a share URL as a Shortlink via
 * the backend (`POST /v1/shortlinks`), reusing the shared `@dimensiondev/short-link` parser so both
 * apps agree on which links are eligible and how the destination URL is normalized.
 *
 * Falls back to the input URL for link shapes short-link doesn't support (not a recognized
 * post/profile/prediction link) or if the create call fails — a shared link is always correct, short
 * or not.
 */
export function useShortShareUrl(url: string): ShortShareUrl {
    const identity = url ? parseLink(url) : null;

    const mutation = useMutation({
        mutationFn: () => getFireflyEndpoint().createShortlink(buildDestinationUrl(identity!)),
    });

    // Synchronous dedup guards, independent of when react-query re-renders with the settled mutation
    // state: a record cache (so a second register() after the first resolved never re-registers) and
    // an in-flight promise (so concurrent calls share the same request instead of firing twice).
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
