import { bom, parseJson } from '@dimensiondev/utils';
import { z } from 'zod';

import { type ProfileSource, Source } from '@/constants/enum.js';
import { resolveProfileStorageKey } from '@/helpers/resolveProfileStorageKey.js';
import { type ProfileSchema, ProfileStoreSchema } from '@/schemas/profile.js';

export type StateProfile = z.infer<typeof ProfileSchema>;

export function getCurrentProfileFromStorage<T extends ProfileSource>(source: T): StateProfile | null {
    const state = bom.localStorage?.getItem(resolveProfileStorageKey(source));
    if (!state) return null;

    const jsonData = parseJson<z.infer<typeof ProfileStoreSchema>>(state);
    const parsed = ProfileStoreSchema.safeParse(jsonData);
    if (!parsed.success || !jsonData) {
        console.error('Failed to parse profile state from storage', parsed.error);
        return null;
    }

    // No profile found
    if (!jsonData.state.currentProfile) return null;

    return jsonData.state.currentProfile as StateProfile;
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
    const state = bom.localStorage?.getItem(resolveProfileStorageKey(source));
    if (!state) return [];

    const parsed = ProfileStoreSchema.safeParse(parseJson(state));
    if (!parsed.success) {
        console.error('Failed to parse profile state from storage', parsed.error);
        return [];
    }

    return parsed.data.state.accounts.map((x) => x.profile);
}
