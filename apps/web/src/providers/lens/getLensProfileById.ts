import { NotFoundError } from '@dimensiondev/utils';
import { fetchAccount } from '@lens-protocol/client/actions';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getAccountWithStatsById } from '@/providers/lens/getAccountWithStats.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export async function getLensProfileById(profileId: string, includeGraphStats?: boolean): Promise<Profile> {
    if (includeGraphStats) {
        return getAccountWithStatsById(profileId);
    }
    const result = await ensureLensResult(fetchAccount(getLensClient(), { address: safeEvmAddress(profileId) }));
    if (!result) throw new NotFoundError('No profile found');

    return formatLensProfileV3(result);
}
