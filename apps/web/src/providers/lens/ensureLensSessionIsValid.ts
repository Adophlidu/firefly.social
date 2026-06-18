import { Source } from '@dimensiondev/enums';
import type { Account } from '@lens-protocol/client';

import { SessionExpiredError } from '@/constants/error.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { LENS_ACCOUNT_FRAGMENTS } from '@/providers/lens/queries/lensAccountFragments.js';
import { refreshLensSession } from '@/providers/lens/refreshLensSession.js';
import type { LensSession } from '@/providers/lens/Session.js';

const LENS_ME_QUERY = `
    query Me {
        me {
            loggedInAs {
                ... on AccountManaged {
                    account {
                        ...Account
                        __typename
                    }
                    __typename
                }
                ... on AccountOwned {
                    account {
                        ...Account
                        __typename
                    }
                    __typename
                }
                __typename
            }
            __typename
        }
    }
${LENS_ACCOUNT_FRAGMENTS}`;

async function fetchMe(session: LensSession) {
    const response = await fetchJson<{
        data: {
            me: {
                loggedInAs: {
                    account: Account;
                };
            };
        } | null;
        errors?: Array<{ message: string }>;
    }>('https://api.lens.xyz/graphql', {
        method: 'POST',
        headers: {
            'X-Access-Token': session.token,
        },
        body: JSON.stringify({
            operationName: 'Me',
            variables: {},
            query: LENS_ME_QUERY,
        }),
    });
    if ((response.errors?.length || 0) > 0) {
        throw new SessionExpiredError(Source.Lens, response.errors?.map((e) => e.message).join(', '));
    }
}

export async function ensureLensSessionIsValid(session: LensSession): Promise<LensSession> {
    try {
        await fetchMe(session);

        return session;
    } catch (err) {
        if (err instanceof SessionExpiredError) {
            const result = await refreshLensSession(session);
            return result;
        }

        throw err;
    }
}
