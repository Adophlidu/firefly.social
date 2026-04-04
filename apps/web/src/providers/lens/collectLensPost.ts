import { bookmarkPost } from '@lens-protocol/client/actions';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function collectLensPost(postId: string): Promise<void> {
    await ensureLensResult(bookmarkPost(lensSessionClientHolder.sessionClient, { post: postId }));
}
