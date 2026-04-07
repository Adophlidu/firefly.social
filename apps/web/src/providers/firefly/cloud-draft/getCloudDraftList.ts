import { EMPTY_LIST } from '@dimensiondev/constants';
import urlcat from 'urlcat';

import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type CloudDraft } from '@/providers/types/CloudDraft.js';
import { type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    indicator?: PageIndicator;
    size?: number;
}

export async function getCloudDraftList(options?: Options) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/ff_post/cloud_draft/list', {
        size: options?.size || 20,
        cursor: options?.indicator?.id,
    });
    const response = await fireflySessionHolder.fetchWithSession<
        Response<{
            list: CloudDraft[];
            next_cursor: string | null;
        }>
    >(url);
    const data = resolveFireflyResponseData(response);

    return createPageable(
        data.list || EMPTY_LIST,
        createIndicator(options?.indicator),
        data.next_cursor ? createNextIndicator(options?.indicator, data.next_cursor) : undefined,
    );
}
