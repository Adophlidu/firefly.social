import type { Metadata } from 'next';

import { getTxPageMetadata } from '@/helpers/getTxPageData.js';

export async function createTransactionMetadata(chainId: number, hash: string, pathname: string): Promise<Metadata> {
    return getTxPageMetadata(chainId, hash, pathname);
}
