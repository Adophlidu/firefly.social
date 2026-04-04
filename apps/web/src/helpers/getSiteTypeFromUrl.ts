import { parseUrl } from '@dimensiondev/utils';

import { ExternalSiteDomain } from '@/constants/enum.js';
import { matchDomainSuffix } from '@/helpers/matchDomainSuffix.js';

function parseSiteType(url: string) {
    return Object.values(ExternalSiteDomain).find((domain) => matchDomainSuffix(url, domain));
}

export function getSiteTypeFromUrl(url: string) {
    const siteType = parseSiteType(url);
    if (!siteType) return null;

    const parsedURL = parseUrl(url);
    if (!parsedURL) return null;

    return { siteType, parsedURL };
}
