import urlcat from 'urlcat';

import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { parseCAIP19 } from '@/helpers/parseCAIP19.js';

/** Same URL shape as frame host `viewToken` — relative path for in-app navigation. */
export function getSnapViewTokenPath(caip19: string): string | null {
    let token: ReturnType<typeof parseCAIP19>;
    try {
        token = parseCAIP19(caip19);
    } catch {
        return null;
    }

    const chainId = token.chainReference;

    switch (token.namespace) {
        case 'erc20':
            return urlcat(`/token/${token.reference}`, { chainId });
        case 'erc721':
            return `/nft/${chainId}/${token.reference}${token.tokenId ? `/${token.tokenId}` : ''}`;
        case 'native':
            if (token.chainNamespace === 'eip155' && token.reference) {
                return urlcat(`/token/${token.reference}`, { chainId });
            }
            return null;
        case 'slip44':
            // CAIP-19 native ETH is often eip155:N/slip44:60
            if (token.chainNamespace === 'eip155' && token.reference === '60') {
                return urlcat(`/token/${ETH_ZERO_ADDRESS}`, { chainId });
            }
            return null;
        default:
            return null;
    }
}
