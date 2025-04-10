import { ensureLensResultSync } from '@/helpers/ensureLensResult.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import type { FetchClubsResponse, JoinClubResponse, LeaveClubResponse } from '@/providers/types/Orb.js';

class OrbClub {
    async fetchClubs(options: {
        query?: string;
        club_handle?: string;
        profile_id?: string;
        limit?: number;
        skip?: number;
    }) {
        const response = await fetchJSON<FetchClubsResponse>('/api/club/query', {
            method: 'POST',
            body: JSON.stringify(options),
        });

        return response.success ? response.data : null;
    }

    async joinClub(clubId: string) {
        const credentials = ensureLensResultSync(lensSessionHolder.sessionClient.getCredentials());
        if (!credentials) throw new Error('No lens credentials found');

        const response = await fetchJSON<JoinClubResponse>('/api/club/join', {
            method: 'POST',
            body: JSON.stringify({ id: clubId }),
            headers: {
                'X-Lens-Identity-Token': credentials.idToken,
            },
        });

        return response.data.added ?? false;
    }

    async leaveClub(clubId: string) {
        const credentials = ensureLensResultSync(lensSessionHolder.sessionClient.getCredentials());
        if (!credentials) throw new Error('No lens credentials found');

        const response = await fetchJSON<LeaveClubResponse>('/api/club/leave', {
            method: 'POST',
            body: JSON.stringify({ id: clubId }),
            headers: {
                'X-Lens-Identity-Token': credentials.idToken,
            },
        });

        return !!response.data.profileId && !!response.data.profileId;
    }
}

export const OrbClubProvider = new OrbClub();
