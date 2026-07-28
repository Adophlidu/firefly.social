import { HOME_CLUB, WORLDCUP_2026_GROUP, WORLDCUP_2026_GROUP_ADDRESS } from '@/constants/channel.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { Account } from '@/providers/types/Account.js';
import type { Channel, Profile } from '@/providers/types/SocialMedia.js';
import { useJoinedChannelStore } from '@/store/useJoinedChannelStore.js';

interface LensAccountControl {
    origin?: Account['origin'];
    profile: Pick<Profile, 'profileType'>;
}

/**
 * Resolve the Lens group that should be joined before publishing.
 *
 * Accounts restored through Privy are controlled by the embedded wallet. The
 * `profileType` fallback covers the same accounts before/after account refresh:
 * Lens reports them as either managed or owned by that wallet.
 */
export function resolveLensGroupAddressForSilentJoin(
    account: LensAccountControl | undefined,
    channel: Channel | null | undefined,
) {
    if (!channel || channel.id === HOME_CLUB.id) return;
    if (channel.feedId === WORLDCUP_2026_GROUP.feedId) return WORLDCUP_2026_GROUP_ADDRESS;
    if (account?.origin !== 'force_restore' && !account?.profile.profileType) return;
    return channel.id;
}

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
