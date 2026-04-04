import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';

export function getFarcasterSessionType() {
    return farcasterSessionHolder.withSession((session) => {
        const isGrantByPermission = FarcasterSession.isGrantByPermission(session);
        const isRelayService = FarcasterSession.isRelayService(session);
        const isLoginByWallet = FarcasterSession.isLoginByWallet(session);
        return {
            isLoginByWallet,
            isRelayService,
            isGrantByPermission,
        };
    });
}
