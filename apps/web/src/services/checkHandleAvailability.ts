import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import type { Account } from '@lens-protocol/client';

import { fetchJson } from '@/helpers/fetchJson.js';
import { trimify } from '@/helpers/trimify.js';
import { LENS_ACCOUNT_FRAGMENTS } from '@/providers/lens/queries/lensAccountFragments.js';

const LENS_ACCOUNT_QUERY = `
    query Account($request: AccountRequest!) {
        account(request: $request) {
            ...Account
            __typename
        }
    }
${LENS_ACCOUNT_FRAGMENTS}`;

interface FarcasterHandleQueryRes {
    transfers: Array<{
        id: number;
        owner: string;
        username: string;
    }>;
}
interface LensHandleQueryRes {
    data: {
        account: Account;
    };
}

async function checkFarcasterHandle(handle: string, signal?: AbortSignal) {
    const result = await fetchJson<FarcasterHandleQueryRes>(`https://fnames.farcaster.xyz/transfers?name=${handle}`, {
        signal,
    });
    return result.transfers.length <= 0;
}

async function checkLensHandle(handle: string, signal?: AbortSignal) {
    const result = await fetchJson<LensHandleQueryRes>('https://api.lens.xyz/graphql', {
        method: 'POST',
        body: JSON.stringify({
            operationName: 'Account',
            variables: {
                request: {
                    username: {
                        localName: handle,
                    },
                },
            },
            query: LENS_ACCOUNT_QUERY,
        }),
        signal,
    });

    return !result?.data?.account;
}

export async function checkHandleAvailability(signal: AbortSignal, source: SocialSource, handle: string) {
    if (!trimify(handle)) return false;

    switch (source) {
        case Source.Lens:
            return checkLensHandle(handle, signal);
        case Source.Farcaster:
            return checkFarcasterHandle(handle, signal);
        case Source.Bsky:
        case Source.Twitter:
            return false;
        default:
            safeUnreachable(source);
            return false;
    }
}
