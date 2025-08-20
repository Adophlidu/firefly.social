import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureCreateFireflyPollEvent(pollId: string) {
    return TelemetryProvider.captureEventInSafe(EventId.POLL_CREATE_SUCCESS, {
        poll_id: pollId,
    });
}

export function captureCreateOrbPollEvent(postId: string) {
    return TelemetryProvider.captureEventInSafe(EventId.CREATE_ORB_POLL_SUCCESS, { post_id: postId });
}
