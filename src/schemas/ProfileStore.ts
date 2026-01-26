import z from 'zod';

import { AsyncStatus, Source } from '@/constants/enum.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

export const ProfileSchema = z.custom<Profile>(
    (data) => {
        // Validate only the necessary fields
        const parsed = ProfileRequiredSchema.safeParse(data);
        return parsed.success;
    },
    {
        message: 'Profile validation failed',
    },
);

const ProfileRequiredSchema = z.object({
    profileId: z.string(),
    profileSource: z.union([
        z.literal(Source.Firefly),
        z.literal(Source.Farcaster),
        z.literal(Source.Lens),
        z.literal(Source.Twitter),
        z.literal(Source.Bsky),
        z.literal(Source.Telegram),
        z.literal(Source.Apple),
        z.literal(Source.Google),
        z.literal(Source.Email),
    ]),
    source: z.union([
        z.literal(Source.Farcaster),
        z.literal(Source.Lens),
        z.literal(Source.Twitter),
        z.literal(Source.Bsky),
    ]),
    status: z.union([z.literal(ProfileStatus.Active), z.literal(ProfileStatus.Inactive)]),
    handle: z.string().nullable(),
});

export const AccountSchema = z.object({
    profile: ProfileSchema,
    session: z.string(),
});

export const ProfileStoreSchema = z.object({
    state: z.object({
        accounts: z.array(AccountSchema),
        currentProfile: ProfileSchema.nullable(),
        currentProfileSession: z.string().nullable(),
        status: z.nativeEnum(AsyncStatus),
    }),
    version: z.number(),
});
