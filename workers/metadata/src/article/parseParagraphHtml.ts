import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';
import type { ParagraphContentJson } from '@dimensiondev/workers-shared/types/paragraph.js';

export async function parseParagraphHtml(htmlString: string, jsonString: string) {
    if (!htmlString || !jsonString) return;

    const json = parseJson<{ content: ParagraphContentJson[] }>(jsonString);
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
    const response = rewriter.transform(new Response(htmlString));
    const transformedHtml = await response.text();
    return transformedHtml;
}
