import { InvalidResultError } from '@dimensiondev/utils';
import { fetchPost } from '@lens-protocol/client/actions';

import { retry } from '@/helpers/retry.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensPostV3 } from '@/providers/lens/formatLensPost.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Post } from '@/providers/types/SocialMedia.js';

async function getPostByTxHash(txHash: string): Promise<Post> {
    const result = await ensureLensResult(fetchPost(getLensClient(), { txHash }));
    if (!result) throw new InvalidResultError();
    return formatLensPostV3(result);
}

export async function getPostByTxHashWithPolling(txHash: string): Promise<Post> {
    return retry(() => getPostByTxHash(txHash));
}
