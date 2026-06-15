import { Source } from '@dimensiondev/enums';
import { xIdentityWorker } from '@dimensiondev/workers-client';

import { queryClient } from '@/configs/queryClient.js';
import { isNumericalProfileId } from '@/helpers/isNumericalProfileId.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export async function getTwitterHandleById(id: string) {
    if (!isNumericalProfileId(id)) return id;
    const profile = queryClient.getQueriesData<Profile>({ queryKey: ['profile', Source.Twitter] }).find((x) => {
        x[1]?.profileId === id;
    });
    if (profile?.[1]?.handle) return profile[1].handle;
    const res = await xIdentityWorker['x-identity'].$get({ query: { id } });
    if (!res.ok) throw new Error(`Failed to get twitter handle by id: ${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(`Failed to get twitter handle by id: ${id}`);
    return json.data.username;
}
