import { type ProfilePageSourceInURL, SourceInURL } from '@/constants/enum.js';
import { createMetadataWalletProfile } from '@/helpers/createMetadataWalletProfile.js';
import { fireflyMetadataProvider } from '@/providers/firefly/Metadata.js';

export async function createMetadataProfileById(pathname: string, source: ProfilePageSourceInURL, profileId: string) {
    if (source === SourceInURL.Wallet || source === SourceInURL.WalletMix) {
        return createMetadataWalletProfile(pathname, profileId);
    }
    return fireflyMetadataProvider.createProfileMetadata(source, profileId, pathname);
}
