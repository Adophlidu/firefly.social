import { parseHTML } from 'linkedom';

export function parseHtml(html: string): Document {
    const { document } = parseHTML(html);
    return document;
}
