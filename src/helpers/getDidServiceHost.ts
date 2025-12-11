import { DEFAULT_DID_SERVICE_URL } from '@/constants/bsky.js';
import { getPdsUrlFromSession } from '@/providers/bsky/getPdsUrlFromSession.js';
import type { BskySession } from '@/providers/bsky/Session.js';

export function getDidServiceHost(session: BskySession) {
    const pdsUrl = getPdsUrlFromSession(session);
    if (pdsUrl) return pdsUrl.host;

    return new URL(DEFAULT_DID_SERVICE_URL).host;
}
