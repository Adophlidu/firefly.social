import { parseUrl } from '@dimensiondev/utils';
import { compact, groupBy, uniqBy } from 'lodash-es';

import {
    ENS_REGEXP,
    EXIST_EVM_ADDRESS,
    EXIST_SOLANA_ADDRESS,
    FULL_ENS_REGEXP,
    LENS_HANDLE_REGEXP,
    URL_REGEX,
} from '@/constants/regexp.js';
import { type DetectAddressResponse } from '@/providers/types/Firefly.js';

type AddressRecord = NonNullable<DetectAddressResponse['data']>['list'][number];

export function isAvailableAddress(x: AddressRecord) {
    return !(x.type === 'solana' && x.contract_type === 'program') && x.contract_type !== 'unknown';
}

const hosts = [
    /firefly\.social/,
    /firefly\.mask\.social/,
    /(warpcast\.com|farcaster\.xyz)/,
    /snapshot\.(box|org|page)/,
    /(staging|canary|beta|alpha)\.firefly\.social/,
    /firefly-mask.*-dimension-dev\.vercel\.app/,
    /mask\.io/, // encrypted post payload
];

function shouldIgnoreLink(link: string) {
    const url = parseUrl(link);
    if (!url) return false;
    const match = hosts.some((re) => re.test(url.host));
    if (match) return true;
    const isTako = isTakoPost(link);
    if (isTako) return true;
    return /^\/post\/farcaster\/0x[a-fA-F0-9]{40}/.test(url.pathname);
}

function isTakoPost(link: string) {
    const url = parseUrl(link);
    if (!url) return false;
    if ((url.host === 'takocast.xyz' || url.host === 'app.tako.so') && /\/cast\/?/.test(url.pathname)) {
        const id = url.searchParams.get('id');
        if (!id) return false;
        return /^0x[a-fA-F0-9]{40}/.test(id);
    }
    return false;
}

/** Extract links, addresses and domains */
export function extractEmbedResources(postRawContent: string | undefined, oembedUrl: string | undefined) {
    if (!postRawContent) return { ignoredLinks: [], links: [], addresses: [], domains: [] };
    const links = uniqBy(
        compact([...(postRawContent.match(URL_REGEX) || []).map((x) => x.trim()), oembedUrl]).filter(
            (x) => !FULL_ENS_REGEXP.test(x) && !LENS_HANDLE_REGEXP.test(x),
        ),
        (x) => x.toLowerCase(),
    );
    const { ignored = [], keep = [] } = groupBy(links, (link) => {
        return shouldIgnoreLink(link) ? 'ignored' : 'keep';
    });

    const evmAddresses = postRawContent.match(EXIST_EVM_ADDRESS) || [];
    const solanaAddresses = postRawContent.match(EXIST_SOLANA_ADDRESS) || [];
    const addresses = compact(
        uniqBy(
            [...evmAddresses, ...solanaAddresses].map((x) => x.trim()),
            (x) => x.toLowerCase(),
        ),
    );

    const domains = uniqBy(
        Array.from(postRawContent.match(ENS_REGEXP) || [], (x) => x.trim()),
        (x) => x.toLowerCase(),
    );

    return { addresses, domains, ignoredLinks: ignored, links: keep };
}
