import { NotImplementedError } from '@dimensiondev/utils';

import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { SessionPayload } from '@/providers/twitter/SessionPayload.js';
import type { Provider } from '@/providers/types/Auth.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import type { ResponseJson } from '@/types/utility.js';

class TwitterAuth implements Provider<SessionPayload> {
    async login(noSession = false): Promise<SessionPayload | null> {
        const response = noSession
            ? await twitterSessionHolder.fetchWithoutSession<ResponseJson<SessionPayload>>('/api/twitter/login', {
                  method: 'POST',
              })
            : await twitterSessionHolder.fetch<ResponseJson<SessionPayload>>('/api/twitter/login', {
                  method: 'POST',
              });
        if (!response.success) return null;
        return response.data;
    }

    async logout(): Promise<void> {
        await twitterSessionHolder.fetchWithoutSession<ResponseJson<SessionPayload>>('/api/twitter/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    me(): Promise<Profile> {
        throw new NotImplementedError();
    }
}

export const TwitterAuthProvider = new TwitterAuth();
