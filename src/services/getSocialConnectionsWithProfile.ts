import { unreachable } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { flatLenConnections } from '@/helpers/formatWalletConnection.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
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

export async function getProfileFromSocialConnections(source: SocialSource, social: SocialConnections) {
    switch (source) {
        case Source.Farcaster: {
            const ids = getProfileIdsFromSocialConnections(source, social);
            if (!ids.length) return EMPTY_LIST;
            return FarcasterSocialMediaProvider.getProfilesByIds(ids);
        }
        case Source.Twitter:
        case Source.Bsky: {
            const ids = getProfileIdsFromSocialConnections(source, social);
            if (!ids.length) return EMPTY_LIST;
            return resolveSocialMediaProvider(source).getProfilesByIds(ids);
        }
        case Source.Lens:
            const connections = flatLenConnections([...social[source].connected, ...social[source].unconnected]);
            const ids = getProfileIdsFromSocialConnections(source, social);
            if (!ids.length) return EMPTY_LIST;
            return LensSocialMediaProvider.getProfilesByIds(connections.map((x) => x.id));
        default:
            unreachable(source);
    }
}

export function getConnections(source: SocialSource, social: SocialConnections) {
    switch (source) {
        case Source.Farcaster:
        case Source.Twitter:
        case Source.Bsky:
            return [...social[source].connected, ...social[source].unconnected];
        case Source.Lens:
            return flatLenConnections([...social[source].connected, ...social[source].unconnected]);
        default:
            unreachable(source);
    }
}
