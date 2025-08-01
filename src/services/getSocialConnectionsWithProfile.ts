import { type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { flatLenConnections } from '@/helpers/formatWalletConnection.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { unreachable } from '@/helpers/unreachable.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { AllConnections } from '@/providers/types/Firefly.js';

export interface SocialConnections {
    [Source.Twitter]: AllConnections['twitter'];
    [Source.Farcaster]: AllConnections['farcaster'];
    [Source.Lens]: AllConnections['lens'];
    [Source.Bsky]: AllConnections['bsky'];
}

export function getProfileIdsFromSocialConnections(source: SocialSource, social: SocialConnections) {
    switch (source) {
        case Source.Farcaster:
        case Source.Twitter:
        case Source.Bsky: {
            const connections = [...social[source].connected, ...social[source].unconnected];
            return connections.map((x) => `${x.id}`);
        }
        case Source.Lens:
            const connections = flatLenConnections([...social[source].connected, ...social[source].unconnected]);
            return connections.map((x) => x.id);
        default:
            unreachable(source);
    }
}

export async function getSocialConnectionsWithProfile(source: SocialSource, social: SocialConnections) {
    switch (source) {
        case Source.Farcaster: {
            const connections = [...social[source].connected, ...social[source].unconnected];
            const ids = getProfileIdsFromSocialConnections(source, social);
            if (!ids.length) return EMPTY_LIST;
            const profiles = await FarcasterSocialMediaProvider.getProfilesByIds(ids);
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
            const ids = getProfileIdsFromSocialConnections(source, social);
            if (!ids.length) return EMPTY_LIST;
            const profiles = await resolveSocialMediaProvider(source).getProfilesByIds(ids);
            return profiles
                .map((profile) => ({
                    profile,
                    connection: connections.find((x) => x.id === profile.profileId)!,
                }))
                .filter((x) => x.connection);
        }
        case Source.Lens:
            const connections = flatLenConnections([...social[source].connected, ...social[source].unconnected]);
            const ids = getProfileIdsFromSocialConnections(source, social);
            if (!ids.length) return EMPTY_LIST;
            const profiles = await LensSocialMediaProvider.getProfilesByIds(connections.map((x) => x.id));
            return profiles
                .map((profile) => ({
                    profile,
                    connection: connections.find((x) => isSameAddress(x.id, profile.profileId))!,
                }))
                .filter((x) => x.connection);
        default:
            unreachable(source);
    }
}
