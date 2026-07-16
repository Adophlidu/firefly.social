import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { useJoinedChannelStore } from '@/store/useJoinedChannelStore.js';

/**
 * Silently ensure the current Lens profile is a member of `groupAddress`.
 *
 * Transparent (no toasts) so Orb comments into a gated group feed don't fail
 * with `FeedGroupGatedNotAMember` — Lens evaluates the group's membership rule
 * server-side on `post()` (FW-7895). Reuses the same join chain as
 * `useJoinClub` (`getChannelById` → `joinChannel` → `joinLensChannel` → Lens
 * `joinGroup`) and the optimistic `useJoinedChannelStore` for a fast path.
 *
 * If the join itself throws, the error propagates so the caller surfaces it
 * (silent = no success toast, not hidden errors).
 */
export async function ensureLensGroupMembership(profileId: string, groupAddress: string) {
    const store = useJoinedChannelStore.getState();
    if (store.hasJoined(profileId, groupAddress)) return; // optimistic fast path

    const channel = await lensSocialMediaProvider.getChannelById(groupAddress, true, undefined, profileId);
    if (channel.isMember) {
        store.markJoined(profileId, groupAddress);
        return;
    }

    await lensSocialMediaProvider.joinChannel(channel); // silent
    store.markJoined(profileId, groupAddress);
}
