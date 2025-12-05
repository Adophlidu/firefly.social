import z from 'zod';

import { Source } from '@/constants/enum.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

export const ProfileSchema = z
    .object({
        profileId: z.string(),
        profileSource: z.union([
            z.literal(Source.Firefly),
            z.literal(Source.Farcaster),
            z.literal(Source.Lens),
            z.literal(Source.Twitter),
            z.literal(Source.Bsky),
        ]),
        source: z.union([
            z.literal(Source.Farcaster),
            z.literal(Source.Lens),
            z.literal(Source.Twitter),
            z.literal(Source.Bsky),
        ]),
        status: z.union([z.literal(ProfileStatus.Active), z.literal(ProfileStatus.Inactive)]),
        handle: z.string().nullable(),
    })
    .transform((v) => v as Profile);

const AccountSchema = z.object({
    profile: ProfileSchema,
    session: z.string(),
});

export const ProfileStoreSchema = z.object({
    state: z.object({
        accounts: z.array(AccountSchema),
        currentProfile: ProfileSchema.nullable(),
    }),
});
