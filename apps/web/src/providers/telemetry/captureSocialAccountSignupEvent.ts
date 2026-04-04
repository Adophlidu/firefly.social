import { NotImplementedError, safeUnreachable } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { type Account } from '@/providers/types/Account.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureSocialSignupEntryClickEvent(source: SocialSource) {
    switch (source) {
        case Source.Farcaster:
            return TelemetryProvider.captureEventInSafe(EventId.FARCASTER_SIGNUP_ENTRY_CLICK, {});
        case Source.Lens:
            return TelemetryProvider.captureEventInSafe(EventId.LENS_SIGNUP_ENTRY_CLICK, {});
        case Source.Bsky:
        case Source.Twitter:
            throw new NotImplementedError();
        default:
            safeUnreachable(source);
            return;
    }
}

export function captureSocialSignupSuccessEvent(account: Account) {
    if (account.origin !== 'signup') return;

    const { profileId, handle, source } = account.profile;

    switch (source) {
        case Source.Farcaster:
            return TelemetryProvider.captureEventInSafe(EventId.FARCASTER_ACCOUNT_CREATE_SUCCESS, {
                farcaster_handle: handle,
            });
        case Source.Lens:
            return TelemetryProvider.captureEventInSafe(EventId.LENS_ACCOUNT_CREATE_SUCCESS, {
                lens_id: profileId,
            });
        case Source.Bsky:
        case Source.Twitter:
            throw new NotImplementedError();
        default:
            safeUnreachable(source);
            return;
    }
}
