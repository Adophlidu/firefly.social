import { isAddress } from 'viem';

import { SearchType } from '@/constants/enum.js';
import { trimify } from '@/helpers/trimify.js';
import { isValidEthereumAddress } from '@/helpers/isValidEthereumAddress.js';

export function resolveSearchTypeFromQuery(query: string) {
    const trimmed = trimify(query || '');

    if (trimmed.startsWith('@')) return SearchType.Profiles;
    if (trimmed.startsWith('/')) return SearchType.Channels;
    if (trimmed.startsWith('$') || isValidEthereumAddress(trimmed)) return SearchType.Tokens;

    return SearchType.Posts;
}
