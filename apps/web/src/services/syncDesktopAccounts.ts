import { SessionType, Source, SourceInURL, STATUS } from '@dimensiondev/enums';

import { encrypt } from '@/helpers/encodec.js';
import { getAccountsFromStorage } from '@/helpers/getAccountsFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { LensSession } from '@/providers/lens/Session.js';
import type { TwitterSession } from '@/providers/twitter/Session.js';
import type {
    DesktopSyncPayload,
    SocialAccountBsky,
    SocialAccountFarcaster,
    SocialAccountLens,
    SocialAccountTwitter,
} from '@/types/sync.js';
import { envs } from '@dimensiondev/envs/web';

export async function syncDesktopAccounts(session: string, cryptoKey: string) {
    const fireflySession = getSessionFromStorage(SessionType.Firefly);
    if (!fireflySession?.token) throw new Error('Firefly session not found');

    // Prepare non-sensitive account data for other platforms
    const farcasterAccounts: SocialAccountFarcaster[] = getAccountsFromStorage(Source.Farcaster).map(
        ({ profile, session }) => ({
            type: SourceInURL.Farcaster,
            user_id: session.profileId.toString(),
            handle: profile.handle || profile.fullHandle || profile.displayName || '',
            token: (session as FarcasterSession).token,
        }),
    );

    const lensAccounts: SocialAccountLens[] = getAccountsFromStorage(Source.Lens).map(({ profile, session }) => ({
        type: SourceInURL.Lens,
        user_id: session.profileId.toString(),
        handle: profile.handle || profile.fullHandle || '',
        idToken: (session as LensSession).identityToken || '',
        accessToken: session.token,
        refreshToken: (session as LensSession).refreshToken || '',
    }));

    const bskyAccounts: SocialAccountBsky[] = getAccountsFromStorage(Source.Bsky).map(({ profile, session }) => ({
        type: SourceInURL.Bsky,
        user_id: session.profileId.toString(),
        handle: profile.handle || '',
        accessJwt: (session as BskySession).sessionPayload?.accessJwt || '',
        refreshJwt: (session as BskySession).sessionPayload?.refreshJwt || '',
    }));

    // Twitter accounts - send profileId, handle, consumerKey, accessToken, accessTokenSecret
    // consumerSecret will be retrieved server-side from Vercel KV
    const twitterAccounts: SocialAccountTwitter[] = getAccountsFromStorage(Source.Twitter).map(
        ({ profile, session }) => ({
            type: SourceInURL.X,
            user_id: session.profileId.toString(),
            profileId: session.profileId.toString(),
            handle: profile.handle || '',
            consumerKey: (session as TwitterSession).payload?.consumerKey || '',
            consumerKeySecret: '', // Will be retrieved server-side
            accessToken: (session as TwitterSession).payload?.accessToken || '',
            accessTokenSecret: (session as TwitterSession).payload?.accessTokenSecret || '',
        }),
    );

    // Prepare and encrypt the account data payload on client
    const accountDataPayload = JSON.stringify({
        twitterAccounts,
        farcasterAccounts,
        lensAccounts,
        bskyAccounts,
        fireflyAccountData: {
            // @deprecated - for legacy session
            firefly_account_token: fireflySession.token,
            account_id: fireflySession?.payload?.accountId,
            account_uid: fireflySession?.payload?.uid,
            display_name: fireflySession?.payload?.displayName,
            avatar: fireflySession?.payload?.avatar,
            ...(envs.external.NEXT_PUBLIC_FIREFLY_JWT_V3 === STATUS.Enabled && fireflySession.jwtPayload
                ? {
                      firefly_session_id: fireflySession.jwtPayload.sessionId,
                      firefly_access_token: fireflySession.jwtPayload.accessToken,
                      firefly_refresh_token: fireflySession.jwtPayload.refreshToken,
                  }
                : null),
        },
    } satisfies DesktopSyncPayload);
    const encryptedPayload = await encrypt(accountDataPayload, cryptoKey);

    await fireflySessionHolder.fetchWithSession('/api/firefly/desktop-sync/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${fireflySession.token}`,
        },
        body: JSON.stringify({
            session,
            cryptoKey,
            encryptedPayload,
        }),
    });
}
