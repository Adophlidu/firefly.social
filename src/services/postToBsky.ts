import { NotImplementedError } from '@/constants/error.js';
import { type CompositePost } from '@/store/useComposeStore.js';
import { type ComposeType } from '@/types/compose.js';

export async function postToBsky(
    type: ComposeType,
    compositePost: CompositePost,
    signal?: AbortSignal,
): Promise<string | undefined> {
    throw new NotImplementedError();
}
