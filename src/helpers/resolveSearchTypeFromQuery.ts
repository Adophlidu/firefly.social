import { SearchType } from '@/constants/enum.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { trimify } from '@/helpers/trimify.js';

export function resolveSearchTypeFromQuery(query: string) {
    const trimmed = trimify(query || '');

    if (trimmed.startsWith('@')) return SearchType.Profiles;
    if (trimmed.startsWith('/')) return SearchType.Channels;
    if (trimmed.startsWith('$') || isValidAddressEthereum(trimmed)) return SearchType.Tokens;

    return SearchType.Posts;
}
