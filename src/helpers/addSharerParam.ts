import urlcat from 'urlcat';

/**
 * Add sharer parameter ?s={fireflyUid} to a URL
 * @param url - Base URL (can be relative or absolute path)
 * @param fireflyUid - Sharer's Firefly UID (optional)
 * @returns URL with sharer parameter added, or original URL if fireflyUid is empty
 */
export function addSharerParam(url: string, fireflyUid?: string): string {
    if (!fireflyUid) return url;

    // Use urlcat to properly handle existing query parameters
    // Example: ?type=multi&s=12345
    return urlcat(url, { s: fireflyUid });
}
