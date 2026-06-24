import { fetchAccountsBulk } from '@lens-protocol/client/actions';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

// Maximum number of profiles to fetch in each request
const MAX_COUNT_PER_REQUEST = 50;

export async function getLensProfilesByIds(ids: string[]): Promise<Profile[]> {
    if (!ids.length) return [];

    const chunks: string[][] = [];
    while (ids.length) {
        const chunk = ids.splice(0, MAX_COUNT_PER_REQUEST);
        chunks.push(chunk);
    }

    const results = await Promise.allSettled(
        chunks.map(async (chunk) =>
            ensureLensResult(
                fetchAccountsBulk(getLensClient(), {
                    addresses: chunk.map((id) => safeEvmAddress(id)),
                }),
            ),
        ),
    );

    return results.flatMap((result) => {
        if (result.status === 'fulfilled') {
            return result.value.map(formatLensProfileV3);
        }

        return [];
    });
}
