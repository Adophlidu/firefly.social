import { safeUnreachable } from '@dimensiondev/utils';

import { useActivityConnections } from '@/components/Activity/hooks/useActivityConnections.js';
import { type SocialSource, Source } from '@/constants/enum.js';

export function useIsLoginInActivity(source?: SocialSource | SocialSource[]) {
    const { data } = useActivityConnections();
    function isConnected(s: SocialSource) {
        if (!data) return false;
        switch (s) {
            case Source.Farcaster:
                return data.rawConnections.farcaster.connected.length > 0;
            case Source.Lens:
                return data.rawConnections.lens.connected.length > 0;
            case Source.Twitter:
                return data.rawConnections.twitter.connected.length > 0;
            case Source.Bsky:
                return data.rawConnections.bsky.connected.length > 0;
            default:
                safeUnreachable(s);
                return false;
        }
    }
    const isLoginFirefly = !!data;
    if (!source) {
        return isLoginFirefly;
    }
    return Array.isArray(source) ? source.some(isConnected) : isConnected(source);
}
