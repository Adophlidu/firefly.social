import { isServer } from '@tanstack/react-query';

import { createTwitterSessionAfterLogin } from '@/providers/twitter/createTwitterSessionPayload.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';

export async function setupTwitterSessionForSSR() {
    if (!isServer) return;

    const payload = await createTwitterSessionAfterLogin();
    if (!payload) {
        if (twitterSessionHolder.session) twitterSessionHolder.removeSession();
        return;
    }

    twitterSessionHolder.resumeSession(TwitterSession.from(payload.clientId, payload));
}
