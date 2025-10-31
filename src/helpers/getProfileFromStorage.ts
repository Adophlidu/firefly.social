import { bom, createLookupTableResolver } from '@dimensiondev/utils';
import { z } from 'zod';

import { type SocialSource, Source } from '@/constants/enum.js';

const Schema = z.object({
    state: z.object({
        currentProfile: z
            .object({
                profileId: z.string(),
                handle: z.string(),
                source: z.union([
                    z.literal(Source.Farcaster),
                    z.literal(Source.Lens),
                    z.literal(Source.Twitter),
                    z.literal(Source.Bsky),
                ]),
                displayName: z.string().optional(),
                pfp: z.string().optional(),
                ownedBy: z
                    .object({
                        address: z.string().optional(),
                    })
                    .optional(),
            })
            .nullable(),
    }),
});

export type StateCurrentProfile = z.infer<typeof Schema>['state']['currentProfile'];

const resolveStorageKey = createLookupTableResolver<SocialSource, string>(
    {
        [Source.Bsky]: 'bsky-state',
        [Source.Twitter]: 'twitter-state',
        [Source.Farcaster]: 'farcaster-state',
        [Source.Lens]: 'lens-state',
    },
    (source) => {
        throw new Error(`Unknown profile source: ${source}`);
    },
);

export function getProfileFromStorage<T extends SocialSource>(source: T): StateCurrentProfile | null {
    if (!bom.localStorage) return null;

    const state = bom.localStorage.getItem(resolveStorageKey(source));
    if (!state) return null;

    const parsed = Schema.safeParse(JSON.parse(state));
    if (!parsed.success) {
        console.error('Failed to parse profile state from storage', parsed.error);
        return null;
    }

    // No profile found
    if (!parsed.data.state.currentProfile) return null;

    return parsed.data.state.currentProfile as StateCurrentProfile;
}

export function getProfileAllFromStorage(): Record<SocialSource, StateCurrentProfile | null> {
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
