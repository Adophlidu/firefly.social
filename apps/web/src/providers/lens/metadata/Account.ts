import { z } from 'zod';

import {
    type MetadataAttribute,
    MetadataAttributeSchema,
    NonEmptyStringSchema,
} from '@/providers/lens/metadata/Base.js';
import { evaluate } from '@/providers/lens/metadata/evaluate.js';
import { type PartialWith } from '@/types/utility.js';

enum AccountMetadataSchemaId {
    LATEST = 'https://json-schemas.lens.dev/account/1.0.0.json',
}
interface AccountMetadataDetails {
    id: string;
    name?: string;
    bio?: string;
    picture?: string;
    coverPicture?: string;
    attributes?: MetadataAttribute[];
}
type AccountOptions = PartialWith<AccountMetadataDetails, 'id'>;

export interface AccountMetadata {
    $schema: AccountMetadataSchemaId;
    lens: AccountMetadataDetails;
    signature?: string;
}

const AccountMetadataSchema: z.ZodType<AccountMetadata, z.ZodTypeDef, object> = z.object({
    $schema: z.literal(AccountMetadataSchemaId.LATEST),
    lens: z.object({
        id: NonEmptyStringSchema,
        name: NonEmptyStringSchema.optional(),
        bio: NonEmptyStringSchema.optional(),
        picture: z.string().min(6).url().optional(),
        coverPicture: z.string().min(6).url().optional(),
        attributes: MetadataAttributeSchema.array().min(1).optional(),
    }),
    signature: z.string().optional(),
});

export function account({ id = crypto.randomUUID(), ...others }: AccountOptions): AccountMetadata {
    return evaluate(
        AccountMetadataSchema.safeParse({
            $schema: AccountMetadataSchemaId.LATEST,
            lens: {
                id,
                ...others,
            },
        }),
    );
}
