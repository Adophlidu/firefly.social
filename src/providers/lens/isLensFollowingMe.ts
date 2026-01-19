import { fetchFollowStatus } from '@lens-protocol/client/actions';
import { first } from 'lodash-es';

import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export async function isLensFollowingMe(profileId: string): Promise<boolean> {
    const session = getSessionFromStorage(SessionType.Lens);
    if (!session) return false;

    const result = await ensureLensResult(
        fetchFollowStatus(getLensClient(), {
            pairs: [
                {
                    account: safeEvmAddress(session.profileId),
                    follower: safeEvmAddress(profileId),
                },
            ],
        }),
    );

    return first(result)?.isFollowing.onChain ?? false;
}
