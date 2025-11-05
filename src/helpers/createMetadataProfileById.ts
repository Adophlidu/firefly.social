import { type ProfilePageSourceInURL, SourceInURL } from '@/constants/enum.js';
import { fireflyMetadataProvider } from '@/providers/firefly/Metadata.js';

export async function createMetadataProfileById(source: ProfilePageSourceInURL, profileId: string, pathname: string) {
    if (source === SourceInURL.Wallet || source === SourceInURL.WalletMix) {
        return fireflyMetadataProvider.createWalletProfileMetadata(pathname, profileId);
    }
    return fireflyMetadataProvider.createProfileMetadata(source, profileId, pathname);
}
