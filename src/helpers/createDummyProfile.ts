import { safeUnreachable } from '@masknet/kit';

import { type ProfileSource, type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import type { ThirdPartySession } from '@/providers/third-party/Session.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

export function createDummyProfile(source: SocialSource, profileSource: ProfileSource = source) {
    return {
        source,
        profileSource,
        profileId: '',
        handle: '',
        pfp: '',
        displayName: '',
        followerCount: 0,
        followingCount: 0,
        fullHandle: '',
        status: ProfileStatus.Active,
        verified: true,
    } satisfies Profile;
}

export function createDummyProfileFromFireflyAccountId(accountId: string) {
    return {
        ...createDummyProfile(Source.Farcaster),
        profileId: accountId,
    } satisfies Profile;
}

export function createDummyProfileFromThirdPartySession(
    forSource: Source.Telegram | Source.Email,
    session: ThirdPartySession,
) {
    switch (forSource) {
        case Source.Telegram:
            if (!session.payload?.telegram_user_id || !session.payload?.telegram_username) {
                throw new Error('Invalid telegram session');
            }

            return {
                ...createDummyProfile(Source.Farcaster, Source.Telegram),
                profileId: session.payload.telegram_user_id,
                handle: session.payload.telegram_username,
                displayName: session.payload.telegram_username,
                fullHandle: session.payload.telegram_username,
                pfp: session.payload.avatar ?? '',
            } satisfies Profile;
        case Source.Email:
            if (!session.payload?.accountId || !session.payload?.email) {
                throw new Error('Invalid email session');
            }

            return {
                ...createDummyProfile(Source.Farcaster, Source.Email),
                profileId: session.payload.accountId,
                displayName: session.payload.displayName ?? session.payload.email,
                handle: session.payload.email,
                fullHandle: session.payload.email,
                pfp: session.payload.avatar ?? '',
            } satisfies Profile;
        default:
            safeUnreachable(forSource);
            throw new UnreachableError('forSource', forSource);
    }
}
