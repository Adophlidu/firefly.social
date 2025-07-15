import { Action, ActionsRegistry, setProxyUrl } from '@dialectlabs/blinks';
import urlcat from 'urlcat';

import { bom } from '@/helpers/bom.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import type { ActionGetResponse } from '@/providers/types/Blink.js';
import type { ResponseJSON } from '@/types/index.js';
import type { GetClassifyPostLinkOnActionResult } from '@/app/api/post-link/getClassifyPostLink.js';

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
    const response = await fetchJSON<ResponseJSON<GetClassifyPostLinkOnActionResult>>(
        urlcat(`/api/post-link`, {
            url,
        }),
    );
    if (!response.success) return null;
    return deserializeClassifyPostLinkResult(response.data);
}
