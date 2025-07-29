import { fetchJSON } from '@/helpers/fetchJSON.js';
import { resolveResponseData } from '@/providers/bsky/resolveResponseData.js';
import type { ORBPollSignInResponseData, ORBSignInResponseData } from '@/providers/orb/type.js';
import type { ResponseJson } from '@/types/index.js';

class Orb {
    async initSignIn() {
        const response = await fetchJSON<ResponseJson<ORBSignInResponseData>>('/api/orb/init-sign-in');
        const data = resolveResponseData(response, 'Failed to init sign in orb');
        return data;
    }

    async pollSignIn(secret: string) {
        const response = await fetchJSON<ResponseJson<ORBPollSignInResponseData>>('/api/orb/poll-sign-in', {
            method: 'POST',
            body: JSON.stringify({ secret }),
        });
        const data = resolveResponseData(response, 'Failed to poll sign in orb');
        return data;
    }
}

export const OrbProvider = new Orb();
