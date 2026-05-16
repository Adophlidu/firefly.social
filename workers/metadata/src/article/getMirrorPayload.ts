import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';

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

// Helper to extract the content of a <script id=...> tag from HTML
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

export async function getMirrorPayload(html: string) {
    const nextDataJson = await extractNextData(html);
    if (!nextDataJson) return null;

    const data = parseJson<Payload>(nextDataJson);
    if (!data) return null;

    const address = data?.props?.pageProps?.publicationLayoutProject?.address;
    const digest = data?.props?.pageProps?.digest;
    const entry = data?.props?.pageProps?.__APOLLO_STATE__?.[`entry:${digest}`];
    const timestamp = entry?.publishedAtTimestamp ? entry.publishedAtTimestamp * 1000 : undefined;
    const ens = data?.props?.pageProps?.publicationLayoutProject?.ens;
    const displayName = data?.props?.pageProps?.publicationLayoutProject?.displayName;
    const body = entry?.body;
    const cover = entry?.featuredImage?.url;
    return {
        address,
        timestamp,
        ens,
        displayName,
        body,
        cover,
    };
}
