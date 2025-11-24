import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { BookmarkType, FireflyPlatform } from '@/constants/enum.js';
import { formatSnapshotActivityFromFirefly } from '@/helpers/formatSnapshotFromFirefly.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { getProposals } from '@/providers/snapshot/getProposals.js';
import type { SnapshotActivity } from '@/providers/snapshot/type.js';
import type { BookmarkResponse, FireflySnapshotActivity } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getSnapshotBookmarks(
    indicator?: PageIndicator,
): Promise<Pageable<SnapshotActivity, PageIndicator>> {
    return farcasterSessionHolder.withSession(async (session) => {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/find', {
            post_type: BookmarkType.All,
            platforms: FireflyPlatform.DAOs,
            limit: 25,
            cursor: indicator?.id || undefined,
            fid: session?.profileId,
        });
        const response = await fireflySessionHolder.fetch<BookmarkResponse<FireflySnapshotActivity>>(url);

        const data = resolveFireflyResponseData(response);
        const proposals = await getProposals(compact(data.list.map((x) => x.post_content?.metadata.proposal_id)));

        const activities = compact(
            data.list.map((x) => {
                if (!x.post_content) return;
                const proposal = proposals.find((p) => p.id === x.post_content?.metadata.proposal_id);

                return {
                    ...formatSnapshotActivityFromFirefly(x.post_content),
                    proposal,
                };
            }),
        );

        return createPageable(
            activities,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
        );
    });
}
