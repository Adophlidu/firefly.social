import { z } from 'zod';

import { NonEmptyStringSchema, URISchema } from '@/providers/lens/metadata/Base.js';
import { Nft721MetadataAttributeSchema } from '@/providers/lens/metadata/post/Base.js';

export function nftMetadataSchemaWith<Augmentation extends z.ZodRawShape>(augmentation: Augmentation) {
    return z
        .object({
            description: NonEmptyStringSchema.nullable().optional().catch(null),
            external_url: URISchema.nullable().optional().catch(null),
            name: z.string().optional(),
            attributes: Nft721MetadataAttributeSchema.array().optional().catch([]),
            image: URISchema.nullable().optional().catch(null),
            animation_url: URISchema.nullable().optional().catch(null),
        })
        .extend(augmentation)
        .passthrough();
}
