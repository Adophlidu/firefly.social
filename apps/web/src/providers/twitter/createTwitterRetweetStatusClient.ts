import { UnauthorizedError } from '@dimensiondev/utils';

import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterSessionAfterLogin } from '@/providers/twitter/createTwitterSessionPayload.js';

export async function createTwitterRetweetStatusClient(request: Request) {
    const payload = await createTwitterSessionAfterLogin(request);
    if (!payload) return null;

    try {
        return await createTwitterClientV2(request);
    } catch (e) {
        if (e instanceof UnauthorizedError) return null;
        throw e;
    }
}
