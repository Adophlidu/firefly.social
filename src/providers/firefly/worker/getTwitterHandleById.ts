import urlcat from 'urlcat';

import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { isNumericalProfileId } from '@/helpers/isNumericalProfileId.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { type ResponseJson } from '@/types/utility.js';

type GetTwitterHandleByIdResponse = ResponseJson<{
    username: string;
}>;

export async function getTwitterHandleById(id: string) {
    // id is supposed to be numerical, but just in case
    if (!isNumericalProfileId(id)) return id;
    // /x-identity will might fail.
    const profile = queryClient.getQueriesData<Profile>({ queryKey: ['profile', Source.Twitter] }).find((x) => {
        x[1]?.profileId === id;
    });
    if (profile?.[1]?.handle) return profile[1].handle;
    const response = await fetchJson<GetTwitterHandleByIdResponse>(
        urlcat(FIREFLY_WORKER_HOST, `/x-identity`, {
            id,
        }),
        {
            next: {
                revalidate: 3600,
            },
        },
    );
    if (!response.success) {
        throw new Error(`Failed to get twitter handle by id: ${id}`);
    }
    return response.data.username;
}
