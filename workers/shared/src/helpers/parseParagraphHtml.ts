import { first } from '@/shared/src/helpers/first.js';
import { parseJson } from '@/shared/src/helpers/parseJson.js';
import type { ParagraphContentJson } from '@/shared/src/types/paragraph.js';

export async function parseParagraphHtml(htmlString: string, jsonString: string) {
    if (!htmlString || !jsonString) return;

    const json = parseJson<{ content: ParagraphContentJson[] }>(jsonString);
    if (!json) return;

    const twitterEmbeds = json?.content.filter((x) => x.type === 'twitter');
    const svgEmbeds = json?.content.filter((x) => x.type === 'figure');

    // Create lookup maps for efficient access
    const twitterPosterToVideoMap = new Map<string, string>();
    const svgSrcToDimensionsMap = new Map<string, { height: number; width: number }>();

    // Build twitter video mapping
    twitterEmbeds?.forEach((x) => {
        const poster = x.attrs?.tweetData?.video?.poster;
        if (!poster) return;
        const videoSrc = first(x.attrs?.tweetData?.video?.variants.filter((video) => video.type === 'video/mp4'))?.src;
        if (videoSrc) {
            twitterPosterToVideoMap.set(poster, videoSrc);
        }
    });

    // Build SVG dimensions mapping
    svgEmbeds?.forEach((x) => {
        x.content.forEach((svg) => {
            if (svg.attrs?.nextheight && svg.attrs?.nextwidth && svg.attrs?.src) {
                svgSrcToDimensionsMap.set(svg.attrs.src, {
                    height: svg.attrs.nextheight,
                    width: svg.attrs.nextwidth,
                });
            }
        });
    });

    // Create HTMLRewriter to transform the HTML
    const rewriter = new HTMLRewriter().on('img', {
        element(element) {
            const src = element.getAttribute('src');
            if (!src) return;

            // Handle Twitter video replacement
            const videoSrc = twitterPosterToVideoMap.get(src);
            if (videoSrc) {
                element.replace(`<video src="${videoSrc}" controls="true"></video>`, { html: true });
                return;
            }

            // Handle SVG dimensions
            const dimensions = svgSrcToDimensionsMap.get(src);
            if (dimensions) {
                element.setAttribute('height', `${dimensions.height}px`);
                element.setAttribute('width', `${dimensions.width}px`);
            }
        },
    });

    // Transform the HTML using HTMLRewriter
    // Note: We wrap the HTML in a div to maintain compatibility with the original behavior
    const wrappedHtml = `<div style="display:content">${htmlString}</div>`;
    const response = rewriter.transform(new Response(wrappedHtml));
    const transformedHtml = await response.text();

    // Extract innerHTML from the wrapped div
    // Find the matching closing tag by tracking div depth to handle nested divs correctly
    const startTag = '<div style="display:content">';
    const startIndex = transformedHtml.indexOf(startTag);

    if (startIndex !== -1) {
        const contentStart = startIndex + startTag.length;
        let depth = 0;

        for (let i = contentStart; i < transformedHtml.length; i++) {
            if (transformedHtml.substring(i, i + 4) === '<div') {
                depth++;
            } else if (transformedHtml.substring(i, i + 6) === '</div>') {
                if (depth === 0) {
                    return transformedHtml.substring(contentStart, i);
                }
                depth--;
            }
        }

        // Fallback: if we can't find the matching tag, use the last </div>
        const lastDivIndex = transformedHtml.lastIndexOf('</div>');
        if (lastDivIndex !== -1) {
            return transformedHtml.substring(contentStart, lastDivIndex);
        }
    }

    return transformedHtml;
}
