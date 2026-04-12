import { runInSafeAsync, safeUnreachable } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';

function getEventId(source: SocialSource, type: 'follow' | 'unfollow') {
    const isFollow = type === 'follow';
    switch (source) {
        case Source.Farcaster:
            return isFollow ? EventId.FARCASTER_CHANNEL_JOIN_SUCCESS : EventId.FARCASTER_CHANNEL_LEAVE_SUCCESS;
        case Source.Lens:
            return isFollow ? EventId.CHANNEL_JOIN_ON_LENS_SUCCESS : EventId.CHANNEL_LEAVE_ON_LENS_SUCCESS;
        case Source.Bsky:
            return isFollow ? EventId.CHANNEL_ADD_ON_BSKY_SUCCESS : EventId.CHANNEL_REMOVE_ON_BSKY_SUCCESS;
        case Source.Twitter:
            return;
        default:
            safeUnreachable(source);
            return;
    }
}

function getEventParameters(channel: Channel) {
    const { source } = channel;
    const profile = getCurrentProfileFromStorage(source);

    switch (source) {
        case Source.Farcaster:
            return {
                farcaster_handle: profile?.handle,
                channel_handle: channel.id,
            };
        case Source.Lens:
            return {
                lens_id: profile?.profileId,
                group_handle: channel.name || channel.id,
            };
        case Source.Bsky:
            return {
                bsky_handle: profile?.handle,
                feed_name: channel.name,
            };
        case Source.Twitter:
            return;
        default:
            safeUnreachable(source);
            return;
    }
}

async function captureToggleFollowChannelEvent(channel: Channel, eventId?: EventId) {
    const eventParameters = getEventParameters(channel);
    if (!eventId || !eventParameters) return;

    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(eventId, eventParameters);
    });
}

export async function captureFollowChannelEvent(channel: Channel) {
    return captureToggleFollowChannelEvent(channel, getEventId(channel.source, 'follow'));
}

export async function captureUnfollowChannelEvent(channel: Channel) {
    return captureToggleFollowChannelEvent(channel, getEventId(channel.source, 'unfollow'));
}
