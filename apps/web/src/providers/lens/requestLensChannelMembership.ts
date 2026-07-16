import { Source } from '@dimensiondev/enums';
import { requestGroupMembership } from '@lens-protocol/client/actions';

import { queryClient } from '@/configs/queryClient.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { resolveLensClubJoinAction } from '@/providers/lens/resolveChannelMembershipStatus.js';
import type { Channel, ChannelMembershipStatus } from '@/providers/types/SocialMedia.js';
import { useJoinedChannelStore } from '@/store/useJoinedChannelStore.js';

export type LensClubJoinOutcome = 'joined' | 'pending';

function updateChannelMembershipStatus(channel: Channel, membershipStatus: ChannelMembershipStatus, profileId: string) {
    const updateChannel = (current: Channel): Channel => {
        if (current.source !== Source.Lens || current.id.toLowerCase() !== channel.id.toLowerCase()) return current;
        const joined = membershipStatus === 'joined';
        return {
            ...current,
            membershipStatus,
            isMember: joined,
            canJoin: ['join', 'requestToJoin', 'pendingRequestRejected'].includes(membershipStatus),
            canLeave: joined,
        };
    };

    queryClient.setQueriesData<Channel>({ queryKey: ['channel', Source.Lens, channel.id] }, (current) =>
        current ? updateChannel(current) : current,
    );
    queryClient.setQueryData<Channel>(['channel', Source.Lens, channel.id, profileId], (current) =>
        updateChannel(current ?? channel),
    );
    queryClient.setQueriesData<Channel[]>({ queryKey: ['search-channels', Source.Lens] }, (current) =>
        current?.map(updateChannel),
    );
}

export async function requestLensChannelMembership(channel: Channel): Promise<void> {
    const result = await ensureLensResult(
        requestGroupMembership(lensSessionClientHolder.sessionClient, {
            group: safeEvmAddress(channel.id),
        }),
    );
    await handleOperationWithLensChain(result);
}

export async function leaveLensChannelMembership(channel: Channel, profileId: string): Promise<boolean> {
    const left = await resolveSocialMediaProvider(Source.Lens).leaveChannel(channel);
    if (!left) return false;

    useJoinedChannelStore.getState().markLeft(profileId, channel.id);
    return true;
}

export async function joinOrRequestLensChannel(channel: Channel, profileId: string): Promise<LensClubJoinOutcome> {
    const action = resolveLensClubJoinAction(channel);
    if (!action) throw new Error('The Lens club cannot be joined.');

    if (action === 'request') {
        await requestLensChannelMembership(channel);
        updateChannelMembershipStatus(channel, 'pendingRequest', profileId);
        return 'pending';
    }

    const joined = await resolveSocialMediaProvider(Source.Lens).joinChannel(channel);
    if (!joined) throw new Error('Failed to join the Lens club.');
    useJoinedChannelStore.getState().markJoined(profileId, channel.id);
    updateChannelMembershipStatus(channel, 'joined', profileId);
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['channel', Source.Lens, channel.id] }),
        queryClient.invalidateQueries({ queryKey: ['search-channels', Source.Lens] }),
    ]);
    // Lens and Orb may briefly return the pre-join state while their indexers catch up.
    // Re-apply the confirmed membership after the refresh so stale responses cannot
    // expose another Join action and submit a duplicate join transaction.
    updateChannelMembershipStatus(channel, 'joined', profileId);
    return 'joined';
}
