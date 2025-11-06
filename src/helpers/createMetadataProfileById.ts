import { type ProfilePageSourceInURL, SourceInURL } from '@/constants/enum.js';
import { createProfileMetadata } from '@/providers/firefly/metadata/createProfileMetadata.js';
import { createWalletProfileMetadata } from '@/providers/firefly/metadata/createWalletProfileMetadata.js';

export async function createMetadataProfileById(source: ProfilePageSourceInURL, profileId: string, pathname: string) {
    if (source === SourceInURL.Wallet || source === SourceInURL.WalletMix) {
        return createWalletProfileMetadata(pathname, profileId);
    }
    return createProfileMetadata(source, profileId, pathname);
}
