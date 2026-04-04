import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';

export async function captureLensBindManagerEvent(profile: Profile) {
    return TelemetryProvider.captureEventInSafe(EventId.LENS_BIND_MANAGER_SUCCESS, {
        lens_id: profile.profileId,
    });
}
