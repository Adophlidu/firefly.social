import urlcat from 'urlcat';

import { formatSnapshotActivityFromFirefly } from '@/helpers/formatSnapshotFromFirefly.js';
import { isZero } from '@/helpers/number.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { getProposals } from '@/providers/snapshot/getProposals.js';
import { type DiscoverSnapshotsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function discoverSnapshotActivity(indicator?: PageIndicator) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/snapshot/timeline', {
        size: 20,
        cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
    });

    const response = await fireflySessionHolder.fetch<DiscoverSnapshotsResponse>(url);

    const data = resolveFireflyResponseData(response);
    const proposals = await getProposals(data.result.map((x) => x.metadata.proposal_id));

    const activities = data.result.map((x) => {
        const proposal = proposals.find((p) => p.id === x.metadata.proposal_id);

        return {
            ...formatSnapshotActivityFromFirefly(x),
            proposal,
        };
    });

    return createPageable(
        activities,
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
