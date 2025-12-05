import { getPdsEndpoint, isValidDidDoc } from '@atproto/common-web';

import type { BskySession } from '@/providers/bsky/Session.js';

export function getPdsUrlFromSession(session: BskySession) {
    const didDoc = session.sessionPayload.didDoc;
    if (isValidDidDoc(didDoc)) {
        const endpoint = getPdsEndpoint(didDoc);
        return endpoint ? new URL(endpoint) : undefined;
    }
    return;
}
