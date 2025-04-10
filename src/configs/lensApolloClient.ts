import { ApolloClient, ApolloLink, from, HttpLink, InMemoryCache } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';
import { isServer } from '@tanstack/react-query';

import { Source } from '@/constants/enum.js';
import { LENS_API_URL } from '@/constants/index.js';
import { ensureLensResultSync } from '@/helpers/ensureLensResult.js';
import { getCurrentProfile } from '@/helpers/getCurrentProfile.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';

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

    const credentials = runInSafe(() => ensureLensResultSync(lensSessionHolder.sessionClient.getCredentials()));
    if (!credentials?.accessToken) return next(operation);

    operation.setContext({
        headers: { 'X-Access-Token': credentials.accessToken },
    });

    return next(operation);
});

export const lensApolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    connectToDevTools: true,
    link: from([authLink, retryLink, httpLink]),
});
