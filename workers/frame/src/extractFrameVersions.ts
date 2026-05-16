import {
    applyFrameVersionModifiers,
    type FrameVersionModifierOptions as ExtractFrameVersionsOptions,
} from '@/frame/src/modifiers.js';

function decodeHtmlEntities(raw: string) {
    return raw
        .replaceAll(/&lt;/g, '<')
        .replaceAll(/&gt;/g, '>')
        .replaceAll(/&amp;/g, '&')
        .replaceAll(/&quot;/g, '"')
        .replaceAll(/&apos;/g, "'");
}

export async function extractFrameVersions(html: string, options: ExtractFrameVersionsOptions = {}): Promise<string[]> {
    const versions: string[] = [];

    const rewriter = new HTMLRewriter()
        .on('meta', {
            element(el) {
                const name = el.getAttribute('name');
                const property = el.getAttribute('property');
                if (
                    name === 'of:version' ||
                    property === 'of:version' ||
                    name === 'fc:frame' ||
                    property === 'fc:frame' ||
                    name === 'fc:miniapp' ||
                    property === 'fc:miniapp'
                ) {
                    const content = el.getAttribute('content');
                    if (content) versions.push(decodeHtmlEntities(content));
                }
            },
        })
        .on('script', {
            text(txt) {
                // Look for the JSON string with "name":"fc:frame"
                const matched = txt.text.match(/\\"name\\":\\"fc:frame\\",\\"content\\":\\"((?:\\\\"|[^"])*)\\"\}/);
                if (matched) versions.push(matched[1].replace(/\\\\\\"/g, '"'));
            },
        });

    await rewriter.transform(new Response(html)).text();

    const modifiedVersions: string[] = [];
    for (const version of versions) {
        modifiedVersions.push(await applyFrameVersionModifiers(version, options));
    }

    return modifiedVersions;
}
