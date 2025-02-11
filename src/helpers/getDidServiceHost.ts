import { first } from 'lodash-es';

import { DEFAULT_DID_SERVICE_URL } from '@/constants/bsky.js';
import { parseUrl } from '@/helpers/parseUrl.js';

export function getDidServiceHost(didDoc: {} | undefined) {
    const doc = didDoc as { service?: Array<{ serviceEndpoint: string }> } | undefined;
    const u = parseUrl(first(doc?.service)?.serviceEndpoint ?? DEFAULT_DID_SERVICE_URL);
    if (!u) throw new Error('Failed to parse service endpoint.');
    return u.host;
}
