import type { ProfileSource, SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import z from 'zod';

import { SORTED_SOCIAL_SOURCES, SORTED_THIRD_PARTY_SOURCES } from '@/constants/computed.js';
import { AsyncStatus } from '@/constants/enum.js';
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
    profileSource: z.custom<ProfileSource>(
        (data) => [Source.Firefly, ...SORTED_SOCIAL_SOURCES, ...SORTED_THIRD_PARTY_SOURCES].includes(data),
        {
            message: 'Invalid profile source',
        },
    ),
    source: z.custom<SocialSource>((data) => SORTED_SOCIAL_SOURCES.includes(data), {
        message: 'Invalid social source',
    }),
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
