import { Action, ActionsRegistry, setProxyUrl } from '@dialectlabs/blinks';
import urlcat from 'urlcat';

import type { GetClassifyPostLinkOnActionResult } from '@/app/api/post-link/getClassifyPostLink.js';
import { bom } from '@/helpers/bom.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import type { ActionGetResponse } from '@/providers/types/Blink.js';
import type { ResponseJson } from '@/types/index.js';

export interface ClassifyPostLinkResult extends Omit<GetClassifyPostLinkOnActionResult, 'action'> {
    action?: Action;
}

async function deserializeAction(result: Pick<GetClassifyPostLinkOnActionResult, 'action'>) {
    if (!result.action) return result.action;
    if (bom.location) setProxyUrl(urlcat(bom.location.origin, '/api/blink/proxy'));
    const action = await Action.fetch(result.action.actionApiUrl);
    Action;
    const host = parseUrl(action.url)?.host;
    const instance = ActionsRegistry.getInstance();
    // @ts-ignore fix the blink registry state
    if (instance.websitesByHost && typeof instance.websitesByHost === 'object' && host) {
        // @ts-ignore
        instance.websitesByHost[host] = { host, state: result.action.state };
    }
    // @ts-expect-error _data is private, fix the URL after proxy
    const data = action._data as ActionGetResponse;
    return new Proxy(action, {
        get(target, prop, receiver) {
            if (prop === 'icon') return data.icon;
            return Reflect.get(target, prop, receiver);
        },
    });
}

export async function deserializeClassifyPostLinkResult(
    result: GetClassifyPostLinkOnActionResult,
): Promise<ClassifyPostLinkResult> {
    return {
        ...result,
        action: await deserializeAction(result),
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
    >('/api/post-link', {
        method: 'POST',
        body: JSON.stringify(urls),
    });
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
