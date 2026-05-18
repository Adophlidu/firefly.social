import type { ProfilePageSourceInURL } from '@dimensiondev/enums';
import { SourceInURL } from '@dimensiondev/enums';

import { createProfileMetadata } from '@/providers/firefly/metadata/createProfileMetadata.js';
import { createWalletProfileMetadata } from '@/providers/firefly/metadata/createWalletProfileMetadata.js';

export async function createMetadataProfileById(source: ProfilePageSourceInURL, profileId: string, pathname: string) {
    if (source === SourceInURL.Wallet || source === SourceInURL.WalletMix) {
        return createWalletProfileMetadata(profileId, pathname);
    }
    return createProfileMetadata(source, profileId, pathname);
}
