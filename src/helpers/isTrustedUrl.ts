import type { LinkProps } from 'next/link.js';

import { parseUrl } from '@/helpers/parseUrl.js';

const trustedHosts = [
    'mask.io',
    'mask.notion.site',
    'localhost',
    /^([a-zA-Z0-9-]+\.)*firefly\.land$/,
    /^([a-zA-Z0-9-]+\.)*firefly\.social$/,
    /^([a-zA-Z0-9-]+\.)*mask\.social$/,
];

export function isTrustedUrl(href: LinkProps['href']) {
    if (typeof href !== 'string' || !href.startsWith('http')) return true;

    const parsed = parseUrl(href);
    return parsed
        ? trustedHosts.some((host) => {
              return typeof host === 'string' ? host === parsed.host : host.test(parsed.host);
          })
        : true;
}
