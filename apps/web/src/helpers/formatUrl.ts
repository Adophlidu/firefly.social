/**
 * Strip a url, truncate it to a given max length and add ellipsis if truncated.
 *
 * @param url url to truncate
 * @param maxLength number of characters to truncate to
 * @returns truncated url
 */
export function formatUrl(url: string, maxLength: number): string {
    let strippedUrl = url.replace(/^(http|https):\/\//, '').replace(/^www\./, '');

    // Remove trailing slash if it's just the domain (no path)
    if (/^[^/]+\/$/.test(strippedUrl)) {
        strippedUrl = strippedUrl.slice(0, -1);
    }

    const codePoints = Array.from(strippedUrl);

    if (codePoints.length > maxLength) {
        return codePoints.slice(0, Math.max(0, maxLength - 1)).join('') + '…';
    }
    return strippedUrl;
}
