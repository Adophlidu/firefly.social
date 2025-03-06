import { unreachable } from '@masknet/kit';

import { type SocialSource, Source } from '@/constants/enum.js';
import { flatLenConnections } from '@/helpers/formatWalletConnection.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { AllConnections } from '@/providers/types/Firefly.js';

export interface SocialConnections {
    [Source.Twitter]: AllConnections['twitter'];
    [Source.Farcaster]: AllConnections['farcaster'];
    [Source.Lens]: AllConnections['lens'];
    [Source.Bsky]: AllConnections['bsky'];
}

export async function getSocialConnectionsWithProfile(source: SocialSource, social: SocialConnections) {
    switch (source) {
        case Source.Farcaster: {
            const connections = [...social[source].connected, ...social[source].unconnected];
            const profiles = await resolveSocialMediaProvider(source).getProfilesByIds(
                connections.map((x) => `${x.id}`),
            );
            return profiles
                .map((profile) => ({
                    profile,
                    connection: connections.find((x) => `${x.id}` === profile.profileId)!,
                }))
                .filter((x) => x.connection);
        }
        case Source.Twitter:
        case Source.Bsky: {
            const connections = [...social[source].connected, ...social[source].unconnected];
            const profiles = await resolveSocialMediaProvider(source).getProfilesByIds(connections.map((x) => x.id));
            return profiles
                .map((profile) => ({
                    profile,
                    connection: connections.find((x) => x.id === profile.profileId)!,
                }))
                .filter((x) => x.connection);
        }
        case Source.Lens:
            const connections = flatLenConnections([...social[source].connected, ...social[source].unconnected]);
            const profiles = await LensSocialMediaProvider.getProfilesByIds(connections.map((x) => x.id));
            return profiles
                .map((profile) => ({
                    profile,
                    connection: connections.find((x) => x.id === profile.profileId)!,
                }))
                .filter((x) => x.connection);
        default:
            unreachable(source);
    }
}
