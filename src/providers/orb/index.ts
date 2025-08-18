import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/providers/bsky/resolveResponseData.js';
import type { ORBPollSignInResponseData, ORBSignInResponseData } from '@/providers/orb/type.js';
import type { ResponseJson } from '@/types/utility.js';

class Orb {
    async initSignIn() {
        const response = await fetchJson<ResponseJson<ORBSignInResponseData>>('/api/orb/init-sign-in');
        const data = resolveResponseData(response, 'Failed to init sign in orb');
        return data;
    }

    async pollSignIn(secret: string, signal?: AbortSignal) {
        const response = await fetchJson<ResponseJson<ORBPollSignInResponseData>>('/api/orb/poll-sign-in', {
            method: 'POST',
            body: JSON.stringify({ secret }),
            signal,
        });
        const data = resolveResponseData(response, 'Failed to poll sign in orb');
        return data;
    }
}

export const OrbProvider = new Orb();
