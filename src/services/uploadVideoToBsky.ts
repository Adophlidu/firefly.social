import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function uploadVideoToBsky(file: File) {
    const limits = await bskySessionHolder.agent.app.bsky.video.getUploadLimits();
    if (!limits.success || !limits.data?.canUpload) {
        throw new Error(limits.data?.error || limits.data?.message || 'Failed to get upload limits');
    }

    const { remainingDailyBytes = 0, remainingDailyVideos = 0 } = limits.data;
    if (remainingDailyBytes < file.size || remainingDailyVideos < 1) {
        throw new Error(
            `Daily upload limit reached: ${remainingDailyBytes} bytes remaining, ${remainingDailyVideos} videos remaining`,
        );
    }

    const result = await bskySessionHolder.agent.uploadBlob(file);
    const blobRef = result.data?.blob;
    if (!result.success || !blobRef) {
        throw new Error('Failed to upload video');
    }

    return blobRef;
}
