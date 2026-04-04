import { safeUnreachable } from '@dimensiondev/utils';

import { useActivityConnections } from '@/components/Activity/hooks/useActivityConnections.js';
import { type SocialSource, Source } from '@/constants/enum.js';

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
        case Source.Bsky: {
            const prefix = 'bsky_';
            const rawHandle = data?.rawConnections.bsky.connected[0]?.name;
            return rawHandle?.startsWith(prefix) ? rawHandle.substring(prefix.length) : rawHandle;
        }
        default:
            safeUnreachable(source);
            return;
    }
}
