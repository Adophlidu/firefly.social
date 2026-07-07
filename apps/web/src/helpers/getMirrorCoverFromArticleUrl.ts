import { parseJson } from '@dimensiondev/utils';

interface Payload {
    props: {
        pageProps: {
            __APOLLO_STATE__: Record<
                string,
                {
                    publishedAtTimestamp: number;
                    body: string;
                    featuredImage?: {
                        url: string;
                    };
                }
            >;
            digest: string;
            publicationLayoutProject: {
                address: `0x${string}`;
                ens: string;
                displayName: string;
            };
        };
    };
}

async function extractNextData(html: string): Promise<string | null> {
    let scriptContent = '';
    let found = false;
    const rewriter = new HTMLRewriter().on('script#__NEXT_DATA__', {
        text(text) {
            found = true;
            scriptContent += text.text;
        },
    });
    await rewriter.transform(new Response(html)).arrayBuffer();
    return found && scriptContent ? scriptContent : null;
}

export async function getMirrorCoverFromHtml(html: string) {
    const nextDataJson = await extractNextData(html);
    if (!nextDataJson) return null;

    const data = parseJson<Payload>(nextDataJson);
    if (!data) return null;

    const digest = data?.props?.pageProps?.digest;
    const entry = data?.props?.pageProps?.__APOLLO_STATE__?.[`entry:${digest}`];
    return entry?.featuredImage?.url ?? null;
}

export async function getMirrorCoverFromArticleUrl(articleUrl: string) {
    const response = await fetch(articleUrl, {
        headers: {
            'User-Agent': 'Twitterbot',
        },
    });
    if (!response.ok || (response.status >= 500 && response.status < 600)) return null;

    const html = await response.text();
    return getMirrorCoverFromHtml(html);
}
