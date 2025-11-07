import { safeUnreachable } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';
import type { CompositePost } from '@/store/useComposeStore.js';

function captureCreateOrbPollEvent(postId: string) {
    return TelemetryProvider.captureEventInSafe(EventId.CREATE_ORB_POLL_SUCCESS, { post_id: postId });
}

function captureCreateTwitterPollEvent(pollId: string) {
    return TelemetryProvider.captureEventInSafe(EventId.CREATE_X_POLL_SUCCESS, { poll_id: pollId });
}

export function captureCreateFarPollEvent(pollId: string) {
    return TelemetryProvider.captureEventInSafe(EventId.CREATE_FAR_POLL_SUCCESS, { poll_id: pollId });
}

export function captureCreatePollEvent(sources: SocialSource[], post: CompositePost, pollId?: string) {
    return Promise.allSettled(
        sources.map((source) => {
            const targetId = source === Source.Farcaster ? pollId : post.postId[source];
            if (!targetId) return;

            switch (source) {
                case Source.Farcaster:
                    return captureCreateFarPollEvent(targetId);
                case Source.Lens:
                    return captureCreateOrbPollEvent(targetId);
                case Source.Twitter:
                    return captureCreateTwitterPollEvent(targetId);
                case Source.Bsky:
                    return;
                default:
                    safeUnreachable(source);
                    return;
            }
        }),
    );
}
