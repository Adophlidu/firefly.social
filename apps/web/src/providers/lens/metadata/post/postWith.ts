import { type z } from 'zod';

import { SignatureSchema } from '@/providers/lens/metadata/Base.js';
import { type metadataDetailsWith } from '@/providers/lens/metadata/post/metadataDetailsWith.js';
import { nftMetadataSchemaWith } from '@/providers/lens/metadata/post/nftMetadataSchemaWith.js';

export function postWith<
    Augmentation extends {
        $schema: z.ZodLiteral<string>;
        lens: ReturnType<typeof metadataDetailsWith>;
    },
>(augmentation: Augmentation) {
    return nftMetadataSchemaWith({
        signature: SignatureSchema.optional(),
        ...augmentation,
    });
}
