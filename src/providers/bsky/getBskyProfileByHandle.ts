import { convertBskyHandleToDid } from '@/providers/bsky/convertBskyHandleToDid.js';
import { getBskyProfileById } from '@/providers/bsky/getBskyProfileById.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export async function getBskyProfileByHandle(handle: string): Promise<Profile> {
    const did = await convertBskyHandleToDid(handle);
    return getBskyProfileById(did || handle);
}
