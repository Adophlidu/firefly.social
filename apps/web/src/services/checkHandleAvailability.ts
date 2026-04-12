import { safeUnreachable } from '@dimensiondev/utils';
import type { Account } from '@lens-protocol/client';

import { type SocialSource, Source } from '@/constants/enum.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { trimify } from '@/helpers/trimify.js';

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
            query: 'query Account($request: AccountRequest!) {\n  account(request: $request) {\n    ...Account\n    __typename\n  }\n}\n\nfragment AnyKeyValue on AnyKeyValue {\n  ... on AddressKeyValue {\n    key\n    address\n    __typename\n  }\n  ... on BigDecimalKeyValue {\n    key\n    bigDecimal\n    __typename\n  }\n  ... on StringKeyValue {\n    key\n    string\n    __typename\n  }\n  __typename\n}\n\nfragment Account on Account {\n  owner\n  address\n  rules {\n    anyOf {\n      ...AccountFollowRule\n      __typename\n    }\n    required {\n      ...AccountFollowRule\n      __typename\n    }\n    __typename\n  }\n  operations {\n    ...LoggedInAccountOperations\n    __typename\n  }\n  metadata {\n    ...AccountMetadata\n    __typename\n  }\n  username(request: {autoResolve: true}) {\n    ...Username\n    __typename\n  }\n  heyEns: username(\n    request: {namespace: "0x6821262A0E15Ed3b4bFD54c1B4fe558C093A103B"}\n  ) {\n    ...Username\n    __typename\n  }\n  ...Permissions\n  __typename\n}\n\nfragment AccountFollowRule on AccountFollowRule {\n  id\n  type\n  config {\n    ...AnyKeyValue\n    __typename\n  }\n  __typename\n}\n\nfragment AccountMetadata on AccountMetadata {\n  id\n  name\n  bio\n  picture\n  coverPicture\n  attributes {\n    ...MetadataAttribute\n    __typename\n  }\n  __typename\n}\n\nfragment LoggedInAccountOperations on LoggedInAccountOperations {\n  id\n  isFollowedByMe\n  isFollowingMe\n  isMutedByMe\n  isBlockedByMe\n  hasBlockedMe\n  __typename\n}\n\nfragment Permissions on Account {\n  hasSubscribed: isMemberOf(\n    request: {group: "0x4BE5b4519814A57E6f9AaFC6afBB37eAEeE35aA3"}\n  )\n  isStaff: isMemberOf(\n    request: {group: "0xA7f2835e54998c6d7d4A0126eC0ebE91b5E43c69"}\n  )\n  isBeta: isMemberOf(\n    request: {group: "0x287b09fAa3AfC548F1b28DEa36C30c1edc574C06"}\n  )\n  preferNameInFeed: isMemberOf(\n    request: {group: "0xA942e6BE7A6EA8822316284619B94e7838fA69ac"}\n  )\n  __typename\n}\n\nfragment Username on Username {\n  namespace\n  localName\n  linkedTo\n  value\n  ownedBy\n  __typename\n}\n\nfragment MetadataAttribute on MetadataAttribute {\n  type\n  key\n  value\n  __typename\n}',
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
