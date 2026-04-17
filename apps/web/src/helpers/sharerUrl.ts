import { parseUrl } from '@dimensiondev/utils';

import { URL_REGEX } from '@/constants/regexp.js';
import { SITE_URL_OFFICIAL } from '@/constants/static.js';
import { matchDomainSuffix } from '@/helpers/matchDomainSuffix.js';

const FIREFLY_DOMAINS = ['firefly.social', 'firefly.land'];
const HTTP_PROTOCOL_RE = /^https?:\/\//i;
const DOMAIN_LIKE_URL_RE = /^[a-zA-Z0-9]+([-.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}(:[0-9]{1,5})?(?:[/?#]|$)/i;

function isAbsoluteHttpUrl(url: string) {
    return HTTP_PROTOCOL_RE.test(url);
}

function isDomainLikeUrl(url: string) {
    return DOMAIN_LIKE_URL_RE.test(url);
}

function createUrl(url: string) {
    if (isAbsoluteHttpUrl(url)) return new URL(url);
    if (isDomainLikeUrl(url)) return new URL(`https://${url}`);
    return new URL(url, SITE_URL_OFFICIAL);
}

/**
 * Checks whether a URL belongs to a Firefly-owned domain.
 * Supports URLs with or without protocol.
 */
export function isFireflyOwnedUrl(url: string): boolean {
    const parsedUrl = parseUrl(url);
    if (!parsedUrl || !/^https?:$/i.test(parsedUrl.protocol)) return false;

    return FIREFLY_DOMAINS.some((domain) => matchDomainSuffix(parsedUrl.href, domain));
}

/**
 * Adds sharer parameter ?sid={sharerId} to a URL while preserving the input format:
 * - absolute URL in, absolute URL out
 * - domain-like URL in, domain-like URL out
 * - relative path in, relative path out
 */
export function addSharerParam(url: string, sharerId?: string): string {
    if (!url || !sharerId) return url;

    try {
        const parsedUrl = createUrl(url);
        parsedUrl.searchParams.set('sid', sharerId);

        if (isAbsoluteHttpUrl(url)) return parsedUrl.toString();
        if (isDomainLikeUrl(url)) return `${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
        return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    } catch {
        return url;
    }
}

/**
 * Removes the sharer parameter from Firefly-owned URLs while preserving the input format.
 */
export function removeSharerParam(url: string): string {
    if (!url) return url;

    try {
        const parsedUrl = createUrl(url);
        if (!parsedUrl.searchParams.has('sid')) return url;
        const isRelativeUrl = !isAbsoluteHttpUrl(url) && !isDomainLikeUrl(url);
        if (!isRelativeUrl && !isFireflyOwnedUrl(url)) return url;

        parsedUrl.searchParams.delete('sid');

        if (isAbsoluteHttpUrl(url)) return parsedUrl.toString();
        if (isDomainLikeUrl(url)) return `${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
        return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    } catch {
        return url;
    }
}

/**
 * Adds the sharer parameter to every Firefly-owned URL found in arbitrary pasted text.
 */
export function addSharerParamToFireflyUrls(text: string, sharerId?: string): string {
    if (!text || !sharerId) return text;

    URL_REGEX.lastIndex = 0;

    return text.replace(URL_REGEX, (match) => {
        if (!match || !isFireflyOwnedUrl(match)) return match;
        return addSharerParam(match, sharerId);
    });
}
