/**
 * Unescape common HTML entities in a string
 * @param text The text that may contain HTML entities
 * @returns The text with HTML entities unescaped
 */
export function unescapeHtmlEntities(text: string): string {
    if (!text) return text;

    return (
        text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&copy;/g, '©')
            .replace(/&reg;/g, '®')
            .replace(/&trade;/g, '™')
            .replace(/&hellip;/g, '…')
            .replace(/&mdash;/g, '—')
            .replace(/&ndash;/g, '–')
            .replace(/&ldquo;/g, '"')
            .replace(/&rdquo;/g, '"')
            .replace(/&lsquo;/g, "'")
            .replace(/&rsquo;/g, "'")
            // Handle numeric entities like &#8217; (right single quotation mark)
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(Number.parseInt(dec, 10)))
            // Handle hex entities like &#x2019; (right single quotation mark)
            .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    );
}
