import { useMemo } from 'react';

import { useCurrentFireflyAccountUID } from '@/hooks/useCurrentFireflyAccountUID.js';

/**
 * Add sharer parameter ?sid={ffid} to a URL
 * @param url - Base URL (can be relative or absolute path)
 * @param ffid - Sharer's Firefly UID (optional)
 * @returns URL with sharer parameter added, or original URL if ffid is empty
 */
function addSharerParam(url: string, ffid?: string): string {
    if (!ffid) return url;

    // Parse URL and add s parameter properly
    const urlObj = new URL(url, 'https://firefly.social'); // Use base for relative URLs
    urlObj.searchParams.set('sid', ffid);

    // Return relative URL if input was relative, otherwise return full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return urlObj.toString();
    }
    return urlObj.pathname + urlObj.search + urlObj.hash;
}

/**
 * Automatically add current user's sharer parameter to a URL
 * @param baseUrl - Base URL
 * @returns URL with sharer parameter added (if user is logged in)
 */
export function useShareUrl(baseUrl: string): string {
    const ffid = useCurrentFireflyAccountUID();
    return useMemo(() => addSharerParam(baseUrl, ffid), [baseUrl, ffid]);
}
