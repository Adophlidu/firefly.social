import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';

import { fallbackShareIdentity, type PolymarketShareIdentity } from '@/helpers/polymarketShareImage.js';
import { getPolymarketShareIdentityQueryOptions } from '@/queries/firefly/getPolymarketShareIdentityQueryOptions.js';

/**
 * Resolves the holder identity (Polymarket pseudonym + avatar) for a position/winnings share image.
 * `address` is the owner's Polymarket proxy address; the result is cached per address (one request per
 * connected wallet) and degrades to the shortened address while loading or when no profile is found.
 */
export function usePolymarketShareIdentity(address: string | undefined): PolymarketShareIdentity {
    const { data } = useQuery(getPolymarketShareIdentityQueryOptions(address as Address | undefined));
    return data ?? fallbackShareIdentity(address ?? '');
}
