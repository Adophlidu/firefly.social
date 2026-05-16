/**
 * Extract the text content of an element by its ID using HTMLRewriter (Cloudflare Workers).
 * This is a replacement for DOM-based parsing that works in Cloudflare Workers environment.
 *
 * @param html The HTML string to parse
 * @param elementId The ID of the element to find
 * @returns Promise resolving to the text content of the element, or null if not found
 */
export async function getElementById(html: string, elementId: string): Promise<string | null> {
    let isInsideTarget = false;
    let content = '';
    let elementFound = false;

    const rewriter = new HTMLRewriter().on(`#${elementId}`, {
        element() {
            elementFound = true;
            isInsideTarget = true;
        },
        text(text) {
            if (isInsideTarget) {
                content += text.text;
            }
        },
    });

    await rewriter.transform(new Response(html)).text();

    return elementFound ? content : null;
}
