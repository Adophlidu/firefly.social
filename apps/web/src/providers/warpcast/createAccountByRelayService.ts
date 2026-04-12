import { parseUrl } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { FARCASTER_REPLY_URL, NOT_DEPEND_SECRET, SITE_HOSTNAME, SITE_URL } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { getFarcasterProfileById } from '@/providers/firefly/farcaster-hub/getFarcasterProfileById.js';
import type { Account } from '@/providers/types/Account.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';

interface FarcasterReplyResponse {
    channelToken: string;
    url: string;
    // the same as url
    connectUri: string;
    // cspell: disable-next-line
    // example: dpO7VRkrPcwyLhyFZ
    nonce: string;
}

async function createSession(signal?: AbortSignal) {
    const url = urlcat(FARCASTER_REPLY_URL, '/v1/channel');
    const response = await fetchJson<FarcasterReplyResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            siweUri: SITE_URL,
            domain: parseUrl(SITE_URL)?.hostname ?? SITE_HOSTNAME,
        }),
        signal,
    });

    const now = Date.now();
    const farcasterSession = new FarcasterSession(
        NOT_DEPEND_SECRET,
        NOT_DEPEND_SECRET,
        now,
        now,
        '',
        response.channelToken,
    );

    return {
        deeplink: response.connectUri,
        session: farcasterSession,
    };
}

export async function createAccountByRelayService(callback?: (url: string) => void, signal?: AbortSignal) {
    const { deeplink, session } = await createSession(signal);

    // present QR code to the user or open the link in a new tab
    callback?.(deeplink);

    // polling for the session to be ready
    const fireflySession = await bindOrRestoreFireflySession(session, signal);

    // profile id is available after the session is ready
    const profile = await getFarcasterProfileById(session.profileId);

    return {
        origin: 'sync',
        session,
        profile,
        fireflySession,
    } satisfies Account;
}
