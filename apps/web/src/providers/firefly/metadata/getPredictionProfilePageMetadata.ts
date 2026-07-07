import type { PredictionPlatform } from '@dimensiondev/enums';
import { formatAddress } from '@dimensiondev/web3/utils';
import type { Metadata } from 'next';

import { createPredictionProfileMetadataFromProfile } from '@/providers/firefly/metadata/createPredictionProfileMetadataFromProfile.js';
import { getPredictionProfilePageData } from '@/providers/firefly/metadata/getPredictionProfilePageData.js';
import { getPredictionProfileSocialName } from '@/providers/firefly/metadata/getPredictionProfileSocialName.js';

export async function getPredictionProfilePageMetadata(
    address: string,
    platform: PredictionPlatform,
    pathname: string,
): Promise<Metadata> {
    const profile = await getPredictionProfilePageData(address, platform);
    const walletAddress = profile?.wallet || profile?.proxy || address;
    const socialName = await getPredictionProfileSocialName(walletAddress, platform);
    const displayName = socialName || profile?.platform_name || formatAddress(walletAddress, 4);

    return createPredictionProfileMetadataFromProfile({
        displayName: displayName || `this ${platform} profile`,
        pathname,
        platform,
        address,
    });
}
