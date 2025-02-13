import { safeUnreachable } from '@masknet/kit';

import { useActivityConnections } from '@/components/Activity/hooks/useActivityConnections.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';

export function useActivityCurrentAccountHandle(source: SocialSource) {
    const { data } = useActivityConnections();
    switch (source) {
        case Source.Twitter:
            return data?.rawConnections.twitter.connected[0]?.handle;
        case Source.Lens:
            return (
                data?.rawConnections.lens.connected[0]?.lens?.[0]?.localName ||
                data?.rawConnections.lens.connected[0]?.lens?.[0]?.fullHandle
            );
        case Source.Farcaster:
            return data?.rawConnections.farcaster.connected[0]?.username;
        case Source.Lens:
            return data?.rawConnections.lens.connected[0]?.lens?.[0].fullHandle;
        case Source.Twitter:
            return data?.rawConnections.twitter.connected[0]?.handle;
        case Source.Bsky:
            return data?.rawConnections.bsky.connected[0].handle;
        default:
            safeUnreachable(source);
            return;
    }
}

export function useActivityCurrentAccountProfileId(source: SocialSource): string | undefined {
    const profile = useCurrentProfile(source);
    const { data } = useActivityConnections();
    if (fireflyBridgeProvider.supported) {
        switch (source) {
            case Source.Farcaster:
                const fid = data?.rawConnections.farcaster.connected[0]?.fid;
                return typeof fid === 'number' ? `${fid}` : fid;
            case Source.Lens:
                return data?.rawConnections.lens.connected[0]?.lens?.[0].id;
            case Source.Twitter:
                return data?.rawConnections.twitter.connected[0]?.twitters?.[0].id;
            case Source.Bsky:
                return data?.rawConnections.bsky.connected[0]?.bsky?.[0].id;
            default:
                safeUnreachable(source);
                return;
        }
    }
    return profile?.profileId;
}
