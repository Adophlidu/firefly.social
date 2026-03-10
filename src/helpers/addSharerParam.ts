/**
 * Add sharer parameter ?s={fireflyUid} to a URL
 * @param url - Base URL (can be relative or absolute path)
 * @param fireflyUid - Sharer's Firefly UID (optional)
 * @returns URL with sharer parameter added, or original URL if fireflyUid is empty
 */
export function addSharerParam(url: string, fireflyUid?: string): string {
    if (!fireflyUid) return url;

    // Parse URL and add s parameter properly
    const urlObj = new URL(url, 'https://firefly.social'); // Use base for relative URLs
    urlObj.searchParams.set('s', fireflyUid);

    // Return relative URL if input was relative, otherwise return full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return urlObj.toString();
    }
    return urlObj.pathname + urlObj.search + urlObj.hash;
}
