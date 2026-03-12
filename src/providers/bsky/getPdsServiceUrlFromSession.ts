import { parseUrl } from '@dimensiondev/utils';
import z from 'zod';

import { DEFAULT_DID_SERVICE_URL } from '@/constants/bsky.js';
import { type BskySession } from '@/providers/bsky/Session.js';

const Service = z.object({
    id: z.string(),
    type: z.string(),
    serviceEndpoint: z.union([z.string(), z.record(z.unknown())]),
});
const Scheme = z.object({
    service: z.array(Service).optional(),
});

function getPdsEndpoint(doc: z.infer<typeof Scheme>) {
    if (!doc.service?.length) return;

    const endpoint = doc.service.find(
        (x) => x.id === '#atproto_pds' && x.type === 'AtprotoPersonalDataServer',
    )?.serviceEndpoint;
    if (!endpoint || typeof endpoint !== 'string') return;
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) return;

    return parseUrl(endpoint, { autoFixProtocol: false });
}

export function getPdsServiceUrlFromSession(session: BskySession) {
    const didDoc = session.sessionPayload.didDoc;
    const parsed = Scheme.safeParse(didDoc);
    if (!parsed.success) return session.serviceUrl;
    return getPdsEndpoint(parsed.data) || session.serviceUrl;
}

export function getPdsServiceHostFromSession(session: BskySession) {
    const url = getPdsServiceUrlFromSession(session);
    return url instanceof URL ? url.host : (parseUrl(url)?.host ?? new URL(DEFAULT_DID_SERVICE_URL).host);
}
