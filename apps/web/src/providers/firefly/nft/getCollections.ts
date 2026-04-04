import { compact } from 'lodash-es';

import { fixCollection } from '@/providers/firefly/endpoint/fixCollection.js';
import { getCollection } from '@/providers/firefly/nft/getCollection.js';

export async function getCollections(list: Array<{ contractAddress: string; chainId: number }>) {
    const promises = list.map(async ({ contractAddress, chainId }) => {
        return getCollection(chainId, contractAddress);
    });
    const results = await Promise.allSettled(promises);
    return compact(results.map((x) => (x.status === 'fulfilled' ? x.value : null))).map(fixCollection);
}
