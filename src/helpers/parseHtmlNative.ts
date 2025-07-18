export function parseHtmlNative(html: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
}
