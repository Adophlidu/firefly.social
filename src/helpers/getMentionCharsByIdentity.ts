import { compact } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { FireflyPlatform, type SocialSource, Source } from '@/constants/enum.js';
import { CHAR_TAG, type MentionChars } from '@/helpers/chars.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';

function getMatchedMentionProfile(fireflyProfiles: FireflyProfile[], source: SocialSource) {
    const defaultProfile = fireflyProfiles.find((profile) => profile.identity.source === source && profile.isDefault);
    if (defaultProfile) return defaultProfile;

    return fireflyProfiles.find((profile) => profile.identity.source === source) || null;
}

export async function getMentionCharsByIdentity(identity: FireflyIdentity, targetSource?: SocialSource) {
    const loggedInSources = getCurrentAvailableSources();
    if (!loggedInSources.length) return null;
    if (targetSource && !loggedInSources.includes(targetSource)) return null;

    const fireflyProfiles = await queryClient.fetchQuery<FireflyProfile[]>({
        queryKey: ['related-profiles', identity.source, identity.id],
        staleTime: 1000 * 60 * 60, // 1 hour
        queryFn: () => FireflyEndpointProvider.getAllPlatformProfileByIdentity(identity, false),
    });

    let mentionProfiles: FireflyProfile[] = [];
    if (targetSource) {
        mentionProfiles = compact([getMatchedMentionProfile(fireflyProfiles, targetSource)]);
    } else {
        mentionProfiles = compact(loggedInSources.map((x) => getMatchedMentionProfile(fireflyProfiles, x)));
    }
    if (!mentionProfiles.length) return null;

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
