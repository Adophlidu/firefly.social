import type { Metadata } from 'next';

import { getWalletProfilePageMetadata } from '@/helpers/getWalletProfilePageData.js';

export async function createWalletProfileMetadata(addressOrEns: string, pathname: string): Promise<Metadata> {
    return getWalletProfilePageMetadata(addressOrEns, pathname);
}
