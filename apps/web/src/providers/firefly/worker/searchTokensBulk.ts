import type { TokenWithMarket } from '@dimensiondev/workers-token';

import { tokenWorker } from '@/providers/firefly/worker/clients.js';

export async function searchTokensBulk(searchKeyword: string, fuzzy?: boolean): Promise<TokenWithMarket[]> {
    const res = await tokenWorker.token['search-bulk'].$get({
        query: { keyword: searchKeyword, fuzzy: fuzzy?.toString() as 'true' | 'false' | undefined },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
}
