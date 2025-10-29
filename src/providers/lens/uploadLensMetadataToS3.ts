import { SourceInURL } from '@/constants/enum.js';
import type { AccountMetadata } from '@/providers/lens/metadata/Account.js';
import { uploadToS3 } from '@/services/uploadToS3.js';

export function uploadLensMetadataToS3(metadata: AccountMetadata) {
    const content = JSON.stringify(metadata);
    const file = new File([content], 'lens-profile-metadata.json', {
        type: 'application/json',
    });
    return uploadToS3(file, SourceInURL.Lens);
}
