import type { Account } from '@lens-protocol/client';

import { Source } from '@/constants/enum.js';
import { SessionExpiredError } from '@/constants/error.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { refreshLensSession } from '@/providers/lens/refreshLensSession.js';
import { LensSession } from '@/providers/lens/Session.js';

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
            authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
            operationName: 'Me',
            variables: {},
            query: 'query Me {\n  me {\n    loggedInAs {\n      ... on AccountManaged {\n        account {\n          ...Account\n          __typename\n        }\n        __typename\n      }\n      ... on AccountOwned {\n        account {\n          ...Account\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment AnyKeyValue on AnyKeyValue {\n  ... on AddressKeyValue {\n    key\n    address\n    __typename\n  }\n  ... on BigDecimalKeyValue {\n    key\n    bigDecimal\n    __typename\n  }\n  ... on StringKeyValue {\n    key\n    string\n    __typename\n  }\n  __typename\n}\n\nfragment Account on Account {\n  owner\n  address\n  rules {\n    anyOf {\n      ...AccountFollowRule\n      __typename\n    }\n    required {\n      ...AccountFollowRule\n      __typename\n    }\n    __typename\n  }\n  operations {\n    ...LoggedInAccountOperations\n    __typename\n  }\n  metadata {\n    ...AccountMetadata\n    __typename\n  }\n  username(request: {autoResolve: true}) {\n    ...Username\n    __typename\n  }\n  heyEns: username(\n    request: {namespace: "0x6821262A0E15Ed3b4bFD54c1B4fe558C093A103B"}\n  ) {\n    ...Username\n    __typename\n  }\n  ...Permissions\n  __typename\n}\n\nfragment AccountFollowRule on AccountFollowRule {\n  id\n  type\n  config {\n    ...AnyKeyValue\n    __typename\n  }\n  __typename\n}\n\nfragment AccountMetadata on AccountMetadata {\n  id\n  name\n  bio\n  picture\n  coverPicture\n  attributes {\n    ...MetadataAttribute\n    __typename\n  }\n  __typename\n}\n\nfragment LoggedInAccountOperations on LoggedInAccountOperations {\n  id\n  isFollowedByMe\n  isFollowingMe\n  isMutedByMe\n  isBlockedByMe\n  hasBlockedMe\n  __typename\n}\n\nfragment Permissions on Account {\n  hasSubscribed: isMemberOf(\n    request: {group: "0x4BE5b4519814A57E6f9AaFC6afBB37eAEeE35aA3"}\n  )\n  isStaff: isMemberOf(\n    request: {group: "0xA7f2835e54998c6d7d4A0126eC0ebE91b5E43c69"}\n  )\n  isBeta: isMemberOf(\n    request: {group: "0x287b09fAa3AfC548F1b28DEa36C30c1edc574C06"}\n  )\n  preferNameInFeed: isMemberOf(\n    request: {group: "0xA942e6BE7A6EA8822316284619B94e7838fA69ac"}\n  )\n  __typename\n}\n\nfragment Username on Username {\n  namespace\n  localName\n  linkedTo\n  value\n  ownedBy\n  __typename\n}\n\nfragment MetadataAttribute on MetadataAttribute {\n  type\n  key\n  value\n  __typename\n}',
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
