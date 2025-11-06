import { type ProfilePageSourceInURL, SourceInURL } from '@/constants/enum.js';
import { createProfileMetadata } from '@/providers/firefly/metadatas/createProfileMetadata.js';
import { createWalletProfileMetadata } from '@/providers/firefly/metadatas/createWalletProfileMetadata.js';

export async function createMetadataProfileById(source: ProfilePageSourceInURL, profileId: string, pathname: string) {
    if (source === SourceInURL.Wallet || source === SourceInURL.WalletMix) {
        return createWalletProfileMetadata(pathname, profileId);
    }
    return createProfileMetadata(source, profileId, pathname);
}
