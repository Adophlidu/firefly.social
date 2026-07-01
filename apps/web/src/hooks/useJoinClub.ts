import { Source } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { enqueueErrorMessage, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useJoinedChannelStore } from '@/store/useJoinedChannelStore.js';

/**
 * Join the Lens club (group) that gates replies/reposts on a post. Used by
 * the "Join now" affordance shown when a post is club-gated (FW-7785).
 */
export function useJoinClub(clubAddress?: string) {
    const profile = useCurrentProfile(Source.Lens);

    return useAsyncFn(async () => {
        if (!clubAddress) return false;

        if (!profile?.profileId) {
            openLoginModalWithGuard({ source: Source.Lens });
            return false;
        }

        try {
            const provider = resolveSocialMediaProvider(Source.Lens);
            const channel = await provider.getChannelById(clubAddress, true);
            const result = await provider.joinChannel(channel);
            if (!result) throw new Error('Failed to join the club.');

            // Remember the membership so every club-gated post unblocks right
            // away and stays unblocked across refetches/navigation, even though
            // the Lens indexer still reports the old gate for a while (FW-7831).
            useJoinedChannelStore.getState().markJoined(profile.profileId, clubAddress);

            enqueueSuccessMessage(t`You have joined the club.`);
            return true;
        } catch (error) {
            enqueueErrorMessage(t`Failed to join the club.`, { error });
            throw error;
        }
    }, [clubAddress, profile?.profileId]);
}
