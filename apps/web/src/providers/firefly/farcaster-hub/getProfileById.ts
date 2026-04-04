import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { getFarcasterProfileById } from '@/providers/firefly/farcaster-hub/getFarcasterProfileById.js';

export async function getProfileById(profileId: string) {
    return farcasterSessionHolder.withSession((session) => getFarcasterProfileById(profileId, session?.profileId));
}
