import urlcat from 'urlcat';

import type { GetClassifyPostLinkOnActionResult } from '@/app/api/post-link/getClassifyPostLink.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import type { ResponseJson } from '@/types/utility.js';

export type ClassifyPostLinkResult = GetClassifyPostLinkOnActionResult;

export async function deserializeClassifyPostLinkResult(
    result: GetClassifyPostLinkOnActionResult,
): Promise<ClassifyPostLinkResult> {
    return {
        ...result,
    } satisfies ClassifyPostLinkResult;
}

export async function getClassifyPostLinkWithDeserialization(url: string): Promise<ClassifyPostLinkResult | null> {
    const response = await fetchJson<ResponseJson<GetClassifyPostLinkOnActionResult>>(
        urlcat(`/api/post-link`, {
            url,
        }),
    );
    if (!response.success) return null;
    return deserializeClassifyPostLinkResult(response.data);
}

export async function getClassifyPostLinkWithDeserializationMultiple(urls: string[]): Promise<
    Array<{
        url: string;
        result: ClassifyPostLinkResult;
    }>
> {
    const response = await fetchJson<
        ResponseJson<
            Array<{
                url: string;
                result: GetClassifyPostLinkOnActionResult;
            }>
        >
    >(
        urlcat(`/api/post-link`, {
            'cache-urls': urls.join(','),
        }),
    );
    if (!response.success) return [];

    return Promise.all(
        response.data.map(async (x) => {
            const result = await runInSafeAsync(() => deserializeClassifyPostLinkResult(x.result));
            return {
                ...x,
                result: result || {
                    ...x.result,
                    action: undefined,
                },
            };
        }),
    );
}
