import { ApolloClient, ApolloLink, from, fromPromise, HttpLink, InMemoryCache, toPromise } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';
import { isServer } from '@tanstack/react-query';

import { Source } from '@/constants/enum.js';
import { LENS_API_URL } from '@/constants/index.js';
import { getCurrentProfile } from '@/helpers/getCurrentProfile.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { getLensCredentialsFromStorage } from '@/providers/lens/getLensCredentialsFromStorage.js';
import { parseLensAccessToken } from '@/providers/lens/parseLensAccessToken.js';
import { resumeLensSession } from '@/providers/lens/resumeLensSession.js';
import type { LensSession } from '@/providers/lens/Session.js';
import { useLensStateStore } from '@/store/useProfileStore.js';

const httpLink = new HttpLink({
    uri: LENS_API_URL,
    fetch,
    fetchOptions: 'no-cors',
});

const retryLink = new RetryLink({
    attempts: { max: 3, retryIf: (error) => Boolean(error) },
    delay: { initial: 200, max: Number.POSITIVE_INFINITY, jitter: true },
});

const authLink = new ApolloLink((operation, next) => {
    if (isServer) return next(operation);

    const profile = getCurrentProfile(Source.Lens);
    if (!profile) return next(operation);

    const credentials = runInSafe(() => {
        const localCredentials = getLensCredentialsFromStorage();
        const lensSession = useLensStateStore.getState().currentProfileSession as LensSession | null;
        return {
            accessToken: localCredentials?.data.accessToken || lensSession?.token,
            refreshToken: localCredentials?.data.refreshToken || lensSession?.refreshToken,
        };
    });
    if (!credentials?.accessToken || !credentials?.refreshToken) return next(operation);

    const tokenPayload = parseLensAccessToken(credentials.accessToken);
    const isExpiringSoon = !!tokenPayload?.exp && Date.now() >= tokenPayload.exp * 1000 - 60 * 1000 * 2; // 2 minutes before expiration

    if (!isExpiringSoon) {
        operation.setContext({
            headers: { 'X-Access-Token': credentials.accessToken },
        });

        return next(operation);
    }

    return fromPromise(
        resumeLensSession(profile.profileId)
            .then((newToken) => {
                if (!newToken) return toPromise(next(operation));

                console.log('[Debug]: refreshed access token');
                operation.setContext({
                    headers: { 'X-Access-Token': newToken },
                });
                return toPromise(next(operation));
            })
            .catch(() => toPromise(next(operation))),
    );
});

export const lensApolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    connectToDevTools: true,
    link: from([authLink, retryLink, httpLink]),
});
