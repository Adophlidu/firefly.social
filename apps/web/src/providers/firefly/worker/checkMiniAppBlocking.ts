import { iframeBlockerWorker } from '@dimensiondev/workers-client';

export async function checkMiniAppBlocking(link: string, signal?: AbortSignal) {
    const res = await iframeBlockerWorker['iframe-blocker'].check.$get({ query: { link } }, { init: { signal } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
}
