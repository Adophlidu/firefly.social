import { parseJson } from '@firefly/utils';
import type { Hex } from 'viem';

import { type MirrorPayload, PayloadType } from '@/types/og.js';

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
                address: Hex;
                ens: string;
                displayName: string;
            };
        };
    };
}

export function getMirrorPayload(document: Document): MirrorPayload | null {
    const dataScript = document.getElementById('__NEXT_DATA__');
    const data = dataScript?.innerText ? parseJson<Payload>(dataScript.innerText) : undefined;
    if (!data) return null;

    const address = data?.props?.pageProps?.publicationLayoutProject?.address;
    const digest = data?.props?.pageProps?.digest;
    const entry = data?.props?.pageProps?.__APOLLO_STATE__?.[`entry:${digest}`];
    const timestamp = entry?.publishedAtTimestamp ? entry.publishedAtTimestamp * 1000 : undefined;
    const ens = data?.props?.pageProps?.publicationLayoutProject?.ens;
    const displayName = data?.props?.pageProps?.publicationLayoutProject?.displayName;
    const body = entry?.body;
    const cover = entry.featuredImage?.url;
    return {
        type: PayloadType.Mirror,
        address,
        timestamp,
        ens,
        displayName,
        body,
        cover,
    };
}
