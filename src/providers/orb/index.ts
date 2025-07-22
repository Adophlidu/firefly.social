import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { ORBPollSignInResponseData, ORBSignInResponseData } from '@/providers/orb/type.js';
import type { ResponseJSON } from '@/types/index.js';

class Orb {
    async initSignIn() {
        const response = await fetchJSON<ResponseJSON<ORBSignInResponseData>>('/api/orb/init-sign-in');
        if (!response.success) throw new Error('Failed to init sign in orb');
        return response.data;
    }

    async pollSignIn(secret: string) {
        const response = await fetchJSON<ResponseJSON<ORBPollSignInResponseData>>('/api/orb/poll-sign-in', {
            method: 'POST',
            body: JSON.stringify({ secret }),
        });
        if (!response.success) throw new Error('Failed to poll sign in orb');
        return response.data;
    }
}

export const OrbProvider = new Orb();
