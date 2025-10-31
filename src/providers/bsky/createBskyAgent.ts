import { AtpAgent, type AtpSessionData, type AtpSessionEvent } from '@atproto/api';
import { bom, parseJson } from '@dimensiondev/utils';
import { memoize } from 'lodash-es';

const BSKY_SESSION_STORAGE_KEY = 'bsky-session-sdk-hosted';

export function getBskySessionStorage() {
    if (!bom.localStorage) return null;

    const sessionData = bom.localStorage.getItem(BSKY_SESSION_STORAGE_KEY);
    if (!sessionData) return null;

    const parsedData = parseJson<
        Record<
            string,
            {
                accessJwt: string;
                refreshJwt: string;
            }
        >
    >(sessionData);
    if (!parsedData) return null;

    return parsedData;
}

function setBskySessionStorage(session: AtpSessionData) {
    if (!bom.localStorage) return;

    const currentSession = getBskySessionStorage() || {};
    const newSessionData = {
        ...currentSession,
        [session.did]: {
            accessJwt: session.accessJwt,
            refreshJwt: session.refreshJwt,
        },
    };

    bom.localStorage.setItem(BSKY_SESSION_STORAGE_KEY, JSON.stringify(newSessionData));
}

export function removeBskySessionStorage(did?: string) {
    if (!bom.localStorage) return;

    if (!did) {
        bom.localStorage.removeItem(BSKY_SESSION_STORAGE_KEY);
        return;
    }

    const currentSession = getBskySessionStorage() || {};
    bom.localStorage.setItem(
        BSKY_SESSION_STORAGE_KEY,
        JSON.stringify(Object.fromEntries(Object.entries(currentSession).filter(([key]) => key !== did))),
    );
}

export const createBskyAgent = (serviceUrl: string) => {
    return new AtpAgent({
        service: serviceUrl,
        persistSession: (evt: AtpSessionEvent, session?: AtpSessionData) => {
            if (session && (evt === 'create' || evt === 'update')) {
                setBskySessionStorage(session);
            }
        },
    });
};

export const createAgentOnce: typeof createBskyAgent = memoize(createBskyAgent);
