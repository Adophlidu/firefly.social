import { type ProfilePageSource, type SocialSource, Source } from '@/constants/enum.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

// Simplified version for use with FireflyProfile objects
export function captureProfileAccountClickSimple(source: ProfilePageSource, profileId: string, handle: string) {
    return runInSafeAsync(async () => {
        // Handle wallet account click separately
        if (source === Source.Wallet) {
            return TelemetryProvider.captureEvent(EventId.PROFILE_WALLET_ACCOUNT_CLICK, {
                wallet_address: profileId,
            } as never);
        }

        // Handle social account clicks
        const eventIdMap: Record<SocialSource, EventId> = {
            [Source.Twitter]: EventId.PROFILE_X_ACCOUNT_CLICK,
            [Source.Lens]: EventId.PROFILE_LENS_ACCOUNT_CLICK,
            [Source.Farcaster]: EventId.PROFILE_FARCASTER_ACCOUNT_CLICK,
            [Source.Bsky]: EventId.PROFILE_BSKY_ACCOUNT_CLICK,
        };

        const eventId = eventIdMap[source as SocialSource];
        if (!eventId) return;

        const paramsMap: Record<SocialSource, Record<string, string>> = {
            [Source.Twitter]: { x_id: profileId, x_handle: handle },
            [Source.Lens]: { lens_id: profileId, lens_handle: handle },
            [Source.Farcaster]: { farcaster_id: profileId, farcaster_handle: handle },
            [Source.Bsky]: { bsky_id: profileId, bsky_handle: handle },
        };

        return TelemetryProvider.captureEvent(eventId, paramsMap[source as SocialSource]);
    });
}
