import { NotImplementedError } from '@/constants/error.js';
import { type CompositePost } from '@/store/useComposeStore.js';
import { type ComposeType } from '@/types/compose.js';

export interface BskySchedulePostPayload {}

export async function createBskySchedulePostPayload(
    type: ComposeType,
    compositePost: CompositePost,
    isThread = false,
    signal?: AbortSignal,
): Promise<BskySchedulePostPayload> {
    throw new NotImplementedError();
}
