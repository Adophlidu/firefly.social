import { safeUnreachable, UnreachableError } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { type Profile, SessionType } from '@/providers/types/SocialMedia.js';
import type {
    BskyEventParameters,
    FarcasterEventParameters,
    LensEventParameters,
    TwitterEventParameters,
} from '@/providers/types/Telemetry.js';

export function getSelfProfileEventParameters(source: SocialSource) {
    const selfProfile = getCurrentProfileFromStorage(source);
    if (!selfProfile) throw new Error(`Not profile found, source = ${source}.`);

    switch (source) {
        case Source.Farcaster:
            return {
                farcaster_id: selfProfile.profileId,
                farcaster_handle: selfProfile.handle,
            };
        case Source.Lens:
            return {
                lens_id: selfProfile.profileId,
                lens_handle: selfProfile.handle,
            };
        case Source.Twitter:
            return {
                x_id: selfProfile.profileId,
                x_handle: selfProfile.handle,
            };
        case Source.Bsky:
            return {
                bsky_id: selfProfile.profileId,
                bsky_handle: selfProfile.handle,
            };
        default:
            safeUnreachable(source);
            throw new UnreachableError('source', source);
    }
}

export function getProfileEventParameters(profile: Profile) {
    const fireflySession = getSessionFromStorage(SessionType.Firefly);
    if (!fireflySession) throw new Error('Firefly account id is missing.');

    const source = profile.source;
    if (!source) throw new Error(`Not source found, source = ${source}.`);

    const selfProfile = getCurrentProfileFromStorage(source);
    if (!selfProfile) throw new Error(`Not profile found, source = ${source}.`);

    switch (source) {
        case Source.Farcaster:
            return {
                firefly_account_id: fireflySession.accountIdForEvent,
                farcaster_handle: selfProfile.handle,
                farcaster_id: selfProfile.profileId,
                target_farcaster_id: profile.profileId,
                target_farcaster_handle: profile.handle,
            } satisfies FarcasterEventParameters;
        case Source.Lens:
            return {
                firefly_account_id: fireflySession.accountIdForEvent,
                lens_handle: selfProfile.handle,
                lens_id: selfProfile.profileId,
                target_lens_id: profile.profileId,
                target_lens_handle: profile.handle,
            } satisfies LensEventParameters;
        case Source.Twitter:
            return {
                firefly_account_id: fireflySession.accountIdForEvent,
                x_handle: selfProfile.handle,
                x_id: selfProfile.profileId,
                target_x_id: profile.profileId,
                target_x_handle: profile.handle,
            } satisfies TwitterEventParameters;
        case Source.Bsky:
            return {
                firefly_account_id: fireflySession.accountIdForEvent,
                bsky_handle: selfProfile.handle,
                bsky_id: selfProfile.profileId,
                target_bsky_id: profile.profileId,
                target_bsky_handle: profile.handle,
            } satisfies BskyEventParameters;
        default:
            safeUnreachable(source);
            throw new UnreachableError('source', source);
    }
}
