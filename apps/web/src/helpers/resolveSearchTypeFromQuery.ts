import { SearchType } from '@dimensiondev/enums';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';

import { trimify } from '@/helpers/trimify.js';

export function resolveSearchTypeFromQuery(query: string, isTokenAddress?: boolean) {
    const trimmed = trimify(query || '');

    if (trimmed.startsWith('@')) return SearchType.Profiles;
    if (trimmed.startsWith('/')) return SearchType.Clubs;
    if (trimmed.startsWith('$') || (isValidAddressEthereum(trimmed) && isTokenAddress)) return SearchType.Tokens;

    return SearchType.Posts;
}
