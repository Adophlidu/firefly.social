import { z } from 'zod';

import { type SocialSource, Source } from '@/constants/enum.js';
import { bom } from '@/helpers/bom.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';

const Schema = z.object({
    state: z.object({
        currentProfile: z
            .object({
                profileId: z.string(),
                handle: z.string(),
                source: z.nativeEnum(Source),
            })
            .nullable(),
    }),
});

interface Profile {
    source: SocialSource;
    profileId: string;
    handle: string;
}

const resolveStorageKey = createLookupTableResolver<SocialSource, string>(
    {
        [Source.Bsky]: 'bsky-state',
        [Source.Farcaster]: 'farcaster-state',
        [Source.Lens]: 'lens-state',
        [Source.Twitter]: 'twitter-state',
    },
    (source) => {
        throw new Error(`Unknown profile source: ${source}`);
    },
);

export function getProfileFromStorage<T extends SocialSource>(source: T): Profile | null {
    if (!bom.localStorage) return null;

    const state = bom.localStorage.getItem(resolveStorageKey(source));
    if (!state) return null;

    const parsed = Schema.safeParse(JSON.parse(state));
    if (!parsed.success) {
        console.error('Failed to parse profile state from storage', parsed.error);
        return null;
    }

    return parsed.data.state.currentProfile as Profile;
}

export function getProfileAllFromStorage(): Record<SocialSource, Profile | null> {
    const lensProfile = getProfileFromStorage(Source.Lens);
    const farcasterProfile = getProfileFromStorage(Source.Farcaster);
    const twitterProfile = getProfileFromStorage(Source.Twitter);
    const bskyProfile = getProfileFromStorage(Source.Bsky);

    return {
        [Source.Lens]: lensProfile,
        [Source.Farcaster]: farcasterProfile,
        [Source.Twitter]: twitterProfile,
        [Source.Bsky]: bskyProfile,
    };
}
