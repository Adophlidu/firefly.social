import { createBatcher } from '@dimensiondev/utils';
import { compact } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { getBlockRelation } from '@/providers/firefly/endpoint/getBlockRelation.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { getProfilesByIdsFromOfficial } from '@/providers/twitter/getProfilesByIdsFromOfficial.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';

interface MutedProfilePayload {
    source: Source;
    profileId: string;
}

interface MutedProfileResult {
    source: Source;
    profileId: string;
    blocked: boolean;
}

async function fetcher(payloads: MutedProfilePayload[]): Promise<Record<string, MutedProfileResult>> {
    if (payloads.length === 0) return {};

    const results: Record<string, MutedProfileResult> = {};

    // Separate Bsky, X and Firefly payloads
    const bskyPayloads = payloads.filter((p) => p.source === Source.Bsky);
    const xPayloads = payloads.filter((p) => p.source === Source.Twitter);
    const fireflyPayloads = payloads.filter((p) => p.source !== Source.Bsky && p.source !== Source.Twitter);

    // Batch fetch profiles for Bsky and X
    if (bskyPayloads.length > 0 || xPayloads.length > 0) {
        const result = await Promise.allSettled(
            (
                [
                    { source: Source.Bsky, payloads: bskyPayloads },
                    { source: Source.Twitter, payloads: xPayloads },
                ] as const
            ).map(async ({ source, payloads }) => {
                if (!payloads.length) return;

                switch (source) {
                    case Source.Bsky: {
                        if (!bskySessionHolder.session) return;

                        const response = await bskySessionHolder.agent.getProfiles({
                            actors: payloads.map((p) => p.profileId),
                        });
                        return response.data.profiles.map((profile) => formatBskyProfile(profile));
                    }
                    case Source.Twitter: {
                        if (!twitterSessionHolder.session) return;

                        return getProfilesByIdsFromOfficial(payloads.map((p) => p.profileId));
                    }
                }
            }),
        );
        const allProfiles = compact(result.map((res) => (res.status === 'fulfilled' ? res.value : null))).flat();
        allProfiles.forEach(({ profileId, viewerContext, source }) => {
            const blocked = !!viewerContext?.blocking;
            results[`${source}:${profileId}`] = {
                source,
                profileId,
                blocked,
            };
            queryClient.setQueryData(['profile-is-muted', source, profileId], blocked);
        });
    }

    // Handle Firefly profiles
    if (fireflyPayloads.length > 0 && fireflySessionHolder.session) {
        const conditions = compact(
            fireflyPayloads.map((p) => {
                const snsPlatform = resolveFireflyPlatform(p.source);
                return snsPlatform ? { snsPlatform, snsId: p.profileId } : null;
            }),
        );

        if (conditions.length > 0) {
            const relations = await getBlockRelation(conditions);
            const relationMap = new Map<string, boolean>();
            relations.forEach((relation) => {
                const source = resolveSourceFromFireflyPlatform(relation.snsPlatform);
                relationMap.set(`${source}:${relation.snsId}`, relation.blocked);
            });

            fireflyPayloads.forEach((payload) => {
                const queryKey = ['profile-is-muted', payload.source, payload.profileId];
                const key = `${payload.source}:${payload.profileId}`;
                const blocked = relationMap.get(key) ?? false;

                results[key] = { source: payload.source, profileId: payload.profileId, blocked };
                queryClient.setQueryData(queryKey, blocked);
            });
        }
    }

    return results;
}

const batchedQueryMutedProfile = createBatcher<MutedProfilePayload, MutedProfileResult>('queryMutedProfile', fetcher, {
    makeKey: (payload) => `${payload.source}:${payload.profileId}`,
    size: 1000,
    wait: 1000,
    onMissing: (payload) => {
        // Update cache with default value when profile not found
        queryClient.setQueryData(['profile-is-muted', payload.source, payload.profileId], false);
        return {
            source: payload.source,
            profileId: payload.profileId,
            blocked: false,
        };
    },
});

/**
 * Query muted status for a single profile.
 * This function batches multiple calls together to reduce API requests.
 * Supports both Bsky and Firefly platforms.
 */
export async function queryMutedProfile(source: Source, profileId: string): Promise<boolean | undefined> {
    const result = await batchedQueryMutedProfile({ source, profileId });
    return result?.blocked;
}

export async function queryMutedProfiles(identities: FireflyIdentity[]) {
    await Promise.all(identities.map((identity) => queryMutedProfile(identity.source, identity.id)));
}
