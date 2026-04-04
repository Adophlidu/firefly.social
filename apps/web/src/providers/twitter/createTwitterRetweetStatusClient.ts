import { UnauthorizedError } from '@dimensiondev/utils';

import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterSessionAfterLogin } from '@/providers/twitter/createTwitterSessionPayload.js';

export async function createTwitterRetweetStatusClient() {
    const payload = await createTwitterSessionAfterLogin();
    if (!payload) return null;

    try {
        return await createTwitterClientV2();
    } catch (e) {
        if (e instanceof UnauthorizedError) return null;
        throw e;
    }
}
