import { compact } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { FireflyPlatform, type SocialSource, Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { CHAR_TAG, type MentionChars } from '@/helpers/chars.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';

export async function getMentionCharsByIdentity(identity: FireflyIdentity, onlyLoggedInSources = true) {
    const fireflyProfiles = await queryClient.fetchQuery<FireflyProfile[]>({
        queryKey: ['related-profiles', identity.source, identity.id],
        staleTime: 1000 * 60 * 60, // 1 hour
        queryFn: () => FireflyEndpointProvider.getAllPlatformProfileByIdentity(identity, false),
    });

    let mentionProfiles = compact(
        SORTED_SOCIAL_SOURCES.map((x) => {
            const defaultProfile = fireflyProfiles.find(
                (profile) => profile.identity.source === x && profile.isDefault,
            );
            if (defaultProfile) return defaultProfile;

            return fireflyProfiles.find((profile) => profile.identity.source === x) || null;
        }),
    );
    if (!mentionProfiles.length) return null;

    if (onlyLoggedInSources) {
        const sources = getCurrentAvailableSources();
        mentionProfiles = mentionProfiles.filter((profile) =>
            sources.includes(profile.identity.source as SocialSource),
        );
        if (!mentionProfiles.length) return null;
    }

    return {
        tag: CHAR_TAG.MENTION,
        visible: true,
        content: `@${mentionProfiles[0].displayName}`,
        profiles: compact(
            mentionProfiles.map((profile) => {
                const source = profile.identity.source;
                const platform = source === Source.Bsky ? FireflyPlatform.Bsky : resolveFireflyPlatform(source);
                if (!platform) return null;

                return {
                    platform_id: profile.identity.id,
                    platform,
                    handle: profile.displayName,
                    name: profile.displayName,
                    hit: true,
                    score: 1,
                };
            }),
        ),
    } as MentionChars;
}
