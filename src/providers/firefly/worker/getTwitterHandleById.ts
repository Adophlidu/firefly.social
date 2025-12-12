import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { ResponseJson } from '@/types/utility.js';

export type GetTwitterHandleByIdResponse = ResponseJson<{
    username: string;
}>;

export async function getTwitterHandleById(id: string) {
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
