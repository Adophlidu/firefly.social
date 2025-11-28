import { bom, createLookupTableResolver, parseJson } from '@dimensiondev/utils';
import { z } from 'zod';

import { type ProfileSource, Source } from '@/constants/enum.js';

const ProfileSchema = z.object({
    profileId: z.string(),
    handle: z.string(),
    source: z.union([
        z.literal(Source.Farcaster),
        z.literal(Source.Lens),
        z.literal(Source.Twitter),
        z.literal(Source.Bsky),
    ]),
    profileSource: z.union([
        z.literal(Source.Firefly),
        z.literal(Source.Farcaster),
        z.literal(Source.Lens),
        z.literal(Source.Twitter),
        z.literal(Source.Bsky),
        z.literal(Source.Apple),
        z.literal(Source.Email),
        z.literal(Source.Google),
        z.literal(Source.Telegram),
    ]),
    isProUser: z.boolean().optional(),
    verified: z.boolean().optional(),
    displayName: z.string().optional(),
    pfp: z.string().optional(),
    followingCount: z.number().optional(),
    followerCount: z.number().optional(),
    ownedBy: z
        .object({
            address: z.string().optional(),
        })
        .optional(),
});

const AccountSchema = z.object({
    profile: ProfileSchema,
    session: z.string(),
});

const Schema = z.object({
    state: z.object({
        accounts: z.array(AccountSchema),
        currentProfile: ProfileSchema.nullable(),
    }),
});

export type StateProfile = z.infer<typeof ProfileSchema>;

const resolveStorageKey = createLookupTableResolver<ProfileSource, string>(
    {
        [Source.Firefly]: 'firefly-state',
        [Source.Bsky]: 'bsky-state',
        [Source.Twitter]: 'twitter-state',
        [Source.Farcaster]: 'farcaster-state',
        [Source.Lens]: 'lens-state',
        [Source.Apple]: 'third-party-state',
        [Source.Email]: 'third-party-state',
        [Source.Google]: 'third-party-state',
        [Source.Telegram]: 'third-party-state',
    },
    (source) => {
        throw new Error(`Unknown profile source: ${source}`);
    },
);

export function getCurrentProfileFromStorage<T extends ProfileSource>(source: T): StateProfile | null {
    const state = bom.localStorage?.getItem(resolveStorageKey(source));
    if (!state) return null;

    const parsed = Schema.safeParse(parseJson(state));
    if (!parsed.success) {
        console.error('Failed to parse profile state from storage', parsed.error);
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
    const state = bom.localStorage?.getItem(resolveStorageKey(source));
    if (!state) return [];

    const parsed = Schema.safeParse(parseJson(state));
    if (!parsed.success) {
        console.error('Failed to parse profile state from storage', parsed.error);
        return [];
    }

    return parsed.data.state.accounts.map((x) => x.profile);
}
