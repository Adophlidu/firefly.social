import { parseUrl } from '@dimensiondev/utils';

import { FARCASTER_TOKEN_PATH_RE } from '@/constants/regexp.js';
import { matchDomainSuffix } from '@/helpers/matchDomainSuffix.js';

/**
 * Parse a farcaster.xyz token URL like:
 * https://farcaster.xyz/~/c/base:0x1cdbb57b12f732cfb4dc06f690acef476485b2a5
 */
export function parseFarcasterTokenUrl(url: string): { chainName: string; address: string } | null {
    if (!matchDomainSuffix(url, 'farcaster.xyz')) return null;
    const parsed = parseUrl(url);
    if (!parsed) return null;
    const match = parsed.pathname.match(FARCASTER_TOKEN_PATH_RE);
    if (!match) return null;
    return { chainName: match[1], address: match[2] };
}
