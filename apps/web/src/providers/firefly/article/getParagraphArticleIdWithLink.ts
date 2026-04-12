import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { DigestResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getParagraphArticleIdWithLink(digest: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/misc/linkDigestCache');

    const response = await fireflySessionHolder.fetch<DigestResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            link: digest,
        }),
    });

    if (!response.data?.paragraph) return;

    return response.data.paragraph.id;
}
