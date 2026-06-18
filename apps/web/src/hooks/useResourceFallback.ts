import { useEffect, useState } from 'react';

import { reportResourceFailure, shouldSkipResource } from '@/helpers/resourceFailureTracker.js';

export interface UseResourceFallbackResult {
    /** Current URL to load, or undefined when the chain is exhausted. */
    src: string | undefined;
    /** True when no candidate is left — show a placeholder. */
    failed: boolean;
    /** True until the current src loads or errors. */
    loading: boolean;
    onError: () => void;
    onLoad: () => void;
}

/**
 * Drives an ordered fallback chain (e.g. [optimized, raw, default]) for any URL
 * loader: skips flooding/known-bad hosts, advances on error, caps retries.
 */
export function useResourceFallback(candidates: ReadonlyArray<string | undefined>): UseResourceFallbackResult {
    const sources: string[] = [];
    const seen = new Set<string>();
    for (const candidate of candidates) {
        if (!candidate || seen.has(candidate)) continue;
        seen.add(candidate);
        sources.push(candidate);
    }

    const key = sources.join('|');

    // Reset the cursor when the candidate list changes.
    const [cursor, setCursor] = useState({ key, errorIndex: 0 });
    if (cursor.key !== key) setCursor({ key, errorIndex: 0 });
    const errorIndex = cursor.key === key ? cursor.errorIndex : 0;

    // Skip hosts that are flooding or already failed.
    let index = Math.min(errorIndex, sources.length);
    while (index < sources.length && shouldSkipResource(sources[index])) {
        index += 1;
    }

    const src = sources[index];
    const failed = !src;

    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(true);
    }, [src]);

    return {
        src,
        failed,
        loading,
        onError: () => {
            reportResourceFailure(src);
            setLoading(false);
            setCursor({ key, errorIndex: Math.min(index + 1, sources.length) });
        },
        onLoad: () => setLoading(false),
    };
}
