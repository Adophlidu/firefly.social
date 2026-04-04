import { getAllRelatedProfileInfo } from '@/providers/firefly/endpoint/getAllRelatedProfileInfo.js';

/**
 * Resolve display name for OG "Shared by @…" from the Firefly UID in `?s=`.
 * Swallows errors so OG image generation is not blocked by profile lookup failures.
 */
export async function getSharerHandle(sharerUid: string | null): Promise<string | null> {
    if (!sharerUid || !/^\d+$/.test(sharerUid)) return null;

    try {
        const profiles = await getAllRelatedProfileInfo({ uid: sharerUid }, false);

        return profiles?.account?.displayName || null;
    } catch {
        return null;
    }
}
