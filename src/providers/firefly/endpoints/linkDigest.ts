import urlcat from 'urlcat';

import { adjustAssetUris } from '@/helpers/adjustAssetUris.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fixCollection } from '@/providers/firefly/endpoints/fixCollection.js';
import type { LinkDigestResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function linkDigest(link: string) {
    const response = await fetchJson<LinkDigestResponse>(urlcat(settings.FIREFLY_ROOT_URL, '/v2/misc/linkDigest'), {
        method: 'POST',
        body: JSON.stringify({ link }),
    });

    const data = resolveFireflyResponseData(response);
    if (data.nft) {
        data.nft = adjustAssetUris(data.nft);
        if (data.nft.collection) data.nft.collection = fixCollection(data.nft.collection);
    }
    return data;
}
