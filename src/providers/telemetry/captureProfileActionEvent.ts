import { createLookupTableResolver } from '@dimensiondev/utils';

import { type ProfilePageSource, type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getProfileEventParameters } from '@/providers/telemetry/getProfileEventParameters.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';

type ProfileActionType = 'follow' | 'unfollow' | 'super_follow' | 'super_follow_submit';

const resolveProfileActionEventIds = createLookupTableResolver<
    SocialSource,
    Partial<Record<ProfileActionType, EventId>>
>(
    {
        [Source.Farcaster]: {
            follow: EventId.FARCASTER_PROFILE_FOLLOW_SUCCESS,
            unfollow: EventId.FARCASTER_PROFILE_UNFOLLOW_SUCCESS,
            super_follow: undefined,
        },
        [Source.Lens]: {
            follow: EventId.LENS_PROFILE_FOLLOW_SUCCESS,
            unfollow: EventId.LENS_PROFILE_UNFOLLOW_SUCCESS,
            super_follow: EventId.LENS_PROFILE_SUPER_FOLLOW_SUCCESS,
            super_follow_submit: EventId.LENS_PROFILE_SUPER_FOLLOW_SUBMIT,
        },
        [Source.Twitter]: {
            follow: EventId.X_PROFILE_FOLLOW_SUCCESS,
            unfollow: EventId.X_PROFILE_UNFOLLOW_SUCCESS,
            super_follow: EventId.X_PROFILE_SUPER_FOLLOW_SUCCESS,
        },
        [Source.Bsky]: {
            follow: EventId.BSKY_PROFILE_FOLLOW_SUCCESS,
            unfollow: EventId.BSKY_PROFILE_UNFOLLOW_SUCCESS,
            super_follow: EventId.BSKY_PROFILE_SUPER_FOLLOW_SUCCESS,
        },
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function captureProfileActionEvent(
    action: ProfileActionType,
    profile: Profile,
    options?: {
        followerWalletAddress?: string;
    },
) {
    return runInSafeAsync(async () => {
        const eventIds = resolveProfileActionEventIds(profile.source);
        const eventId = eventIds[action];
        if (!eventId) return;

        return TelemetryProvider.captureEvent(eventId, {
            ...getProfileEventParameters(profile),
            ...(options?.followerWalletAddress ? getWalletEventParameters(options.followerWalletAddress) : {}),
        });
    });
}

export function captureEditProfileClickEvent() {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.PROFILE_EDIT_CLICK, {});
    });
}

export function captureEditProfileSuccessEvent(actions: Array<'change_avatar' | 'change_nickname'>) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.PROFILE_EDIT_SUCCESS, {
            change_avatar: actions.includes('change_avatar'),
            change_nickname: actions.includes('change_nickname'),
        });
    });
}

export function captureProfileChangeAccountClick(source: ProfilePageSource, id: string) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.PROFILE_CHANGE_ACCOUNT_CLICK, {
            target_platform: source,
            target_id: id,
        });
    });
}
