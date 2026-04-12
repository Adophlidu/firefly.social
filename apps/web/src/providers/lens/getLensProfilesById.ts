import { fetchAccountsBulk } from '@lens-protocol/client/actions';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Notification, Profile } from '@/providers/types/SocialMedia.js';

export async function getLensProfilesByIds(ids: string[]): Promise<Profile[]> {
    if (!ids.length) return [];
    const result = await ensureLensResult(
        fetchAccountsBulk(getLensClient(), {
            addresses: ids.map(safeEvmAddress),
        }),
    );
    const profiles = result.map(formatLensProfileV3);

    return profiles;
}
