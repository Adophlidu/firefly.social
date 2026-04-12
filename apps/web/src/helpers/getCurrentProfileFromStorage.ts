import { bom, parseJson } from '@dimensiondev/utils';
import type { z } from 'zod';

import { type ProfileSource, Source } from '@/constants/enum.js';
import { resolveProfileStorageKey } from '@/helpers/resolveProfileStorageKey.js';
import { logger } from '@/libs/Logger.js';
import { type ProfileSchema, ProfileStoreSchema } from '@/schemas/ProfileStore.js';

export type StateProfile = z.infer<typeof ProfileSchema>;

export function getCurrentProfileFromStorage<T extends ProfileSource>(source: T): StateProfile | null {
    if (typeof window === 'undefined') return null;
    const state = bom.localStorage?.getItem(resolveProfileStorageKey(source));
    if (!state) return null;

    const parsed = ProfileStoreSchema.safeParse(parseJson(state));
    if (!parsed.success) {
        logger.error('Failed to parse profile state from storage', parsed.error);
        return null;
    }

    // No profile found
    if (!parsed.data.state.currentProfile) return null;

    return parsed.data.state.currentProfile as StateProfile;
}

export function getCurrentProfileAllFromStorage(): Record<ProfileSource, StateProfile | null> {
    const lensProfile = getCurrentProfileFromStorage(Source.Lens);
    const farcasterProfile = getCurrentProfileFromStorage(Source.Farcaster);
    const twitterProfile = getCurrentProfileFromStorage(Source.Twitter);
    const bskyProfile = getCurrentProfileFromStorage(Source.Bsky);
    const appleProfile = getCurrentProfileFromStorage(Source.Apple);
    const emailProfile = getCurrentProfileFromStorage(Source.Email);
    const googleProfile = getCurrentProfileFromStorage(Source.Google);
    const telegramProfile = getCurrentProfileFromStorage(Source.Telegram);
    const fireflyProfile = getCurrentProfileFromStorage(Source.Firefly);

    return {
        [Source.Lens]: lensProfile,
        [Source.Farcaster]: farcasterProfile,
        [Source.Twitter]: twitterProfile,
        [Source.Bsky]: bskyProfile,
        [Source.Firefly]: fireflyProfile,
        [Source.Apple]: appleProfile,
        [Source.Email]: emailProfile,
        [Source.Google]: googleProfile,
        [Source.Telegram]: telegramProfile,
    };
}

export function getProfilesFromStorage<T extends ProfileSource>(source: T): StateProfile[] {
    if (typeof window === 'undefined') return [];
    const state = bom.localStorage?.getItem(resolveProfileStorageKey(source));
    if (!state) return [];

    const parsed = ProfileStoreSchema.safeParse(parseJson(state));
    if (!parsed.success) {
        logger.error('Failed to parse profile state from storage', parsed.error);
        return [];
    }

    return parsed.data.state.accounts.map((x) => x.profile);
}
