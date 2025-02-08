import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function uploadVideoToBsky(file: File) {
    const result = await bskySessionHolder.agent.uploadBlob(file);
    const blobRef = result.data?.blob;
    if (!result.success || !blobRef) {
        throw new Error('Failed to upload video');
    }

    return blobRef;
}
