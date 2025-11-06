import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { getBlockRelation } from '@/providers/firefly/endpoint/getBlockRelation.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export async function queryMutedProfiles(identities: FireflyIdentity[]) {
    const bskyIdentities = identities.filter((x) => x.source === Source.Bsky);
    if (bskyIdentities.length && bskySessionHolder.session) {
        const response = await bskySessionHolder.agent.getProfiles({ actors: bskyIdentities.map((x) => x.id) });
        const profiles = response.data.profiles.map((profile) => formatBskyProfile(profile));
        profiles.forEach(({ profileId, viewerContext }) => {
            queryClient.setQueryData(['profile-is-muted', Source.Bsky, profileId, true], !!viewerContext?.blocking);
        });
    }

    const session = getSessionFromStorage(SessionType.Firefly);
    if (!session) return;

    const conditions = identities
        .filter((x) => x.source !== Source.Bsky)
        .map((x) => ({
            snsPlatform: resolveFireflyPlatform(x.source)!,
            snsId: x.id,
        }));
    if (!conditions.length) return;

    const relations = await getBlockRelation(conditions);
    relations.forEach(({ snsId, snsPlatform, blocked }) => {
        const source = resolveSourceFromFireflyPlatform(snsPlatform);
        queryClient.setQueryData(['profile-is-muted', source, snsId, true], blocked);
    });
}
