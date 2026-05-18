import { MetadataAttributeType } from '@dimensiondev/enums';
import { setAccountMetadata } from '@lens-protocol/client/actions';
import { compact } from 'lodash-es';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { account } from '@/providers/lens/metadata/Account.js';
import type { MetadataAttribute } from '@/providers/lens/metadata/Base.js';
import { uploadLensMetadataToS3 } from '@/providers/lens/uploadLensMetadataToS3.js';
import type { ProfileEditable } from '@/providers/types/SocialMedia.js';

export async function updateLensProfile(profile: ProfileEditable): Promise<boolean> {
    const attributes: MetadataAttribute[] = compact([
        profile.website
            ? {
                  __typename: 'MetadataAttribute',
                  type: MetadataAttributeType.STRING,
                  key: 'website',
                  value: profile.website,
              }
            : null,
        profile.location
            ? {
                  __typename: 'MetadataAttribute',
                  type: MetadataAttributeType.STRING,
                  key: 'location',
                  value: profile.location,
              }
            : null,
    ]);
    const metadata = account({
        id: crypto.randomUUID(),
        name: profile.displayName,
        bio: profile.bio || undefined,
        picture: profile.pfp || undefined,
        attributes: attributes.length ? attributes : undefined,
    });
    const metadataURI = await uploadLensMetadataToS3(metadata);
    const result = await ensureLensResult(
        setAccountMetadata(lensSessionClientHolder.sessionClient, {
            metadataUri: metadataURI,
        }),
    );
    await handleOperationWithLensChain(result);
    return true;
}
