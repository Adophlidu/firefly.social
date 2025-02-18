import { isServer } from '@tanstack/react-query';

import { createTwitterSessionAfterLogin } from '@/helpers/createTwitterSessionPayload.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';

export async function setupServerTwitterSession() {
    if (!isServer) return;

    const payload = await createTwitterSessionAfterLogin();
    if (!payload) {
        await twitterSessionHolder.removeSession();
        return;
    }

    twitterSessionHolder.resumeSession(TwitterSession.from(payload.clientId, payload));
}
