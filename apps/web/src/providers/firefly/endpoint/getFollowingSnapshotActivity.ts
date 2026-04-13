import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { formatSnapshotActivityFromFirefly } from '@/helpers/formatSnapshotFromFirefly.js';
import { isZero } from '@/helpers/number.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { getProposals } from '@/providers/snapshot/getProposals.js';
import type { DiscoverSnapshotsResponse, FollowingSnapshotActivity } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getFollowingSnapshotActivity({
    indicator,
    walletAddresses,
}: {
    address?: string;
    indicator?: PageIndicator;
    walletAddresses?: string[];
}) {
    const url = urlcat(
        settings.FIREFLY_ROOT_URL,
        walletAddresses && walletAddresses.length > 0 ? '/v1/user/timeline/snapshot' : '/v1/timeline/snapshot',
    );

    const response = await fireflySessionHolder.fetch<DiscoverSnapshotsResponse>(
        url,
        {
            method: 'POST',
            body: JSON.stringify({
                size: 20,
                cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
                walletAddresses,
            }),
        },
        {
            withSession: true,
        },
    );

    const data = resolveFireflyResponseData(response);
    const proposals = await getProposals(data.result.map((x) => x.metadata.proposal_id));

    const activities = data.result.map<FollowingSnapshotActivity>((x) => {
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
