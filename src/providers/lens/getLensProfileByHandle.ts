import { fetchAccount } from '@lens-protocol/client/actions';

import { NotFoundError } from '@/constants/error.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getAccountWithStatsByHandle } from '@/providers/lens/getAccountWithStats.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export async function getLensProfileByHandle(handle: string, includeGraphStats?: boolean): Promise<Profile> {
    if (includeGraphStats) return getAccountWithStatsByHandle(handle);

    const result = await ensureLensResult(fetchAccount(getLensClient(), { username: { localName: handle } }));
    if (!result) throw new NotFoundError('No profile found');

    return formatLensProfileV3(result);
}
