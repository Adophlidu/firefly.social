import { z } from 'zod';

import { NonEmptyStringSchema } from '@/providers/lens/metadata/Base.js';
import { evaluate } from '@/providers/lens/metadata/evaluate.js';
import {
    DEFAULT_LOCALE,
    type NftDetails,
    type NftMetadata,
    PostMainFocus,
    type PostMetadataCommon,
    PostMetadataSchemaId,
} from '@/providers/lens/metadata/post/Base.js';
import { mainContentFocus } from '@/providers/lens/metadata/post/mainContentFocus.js';
import { metadataDetailsWith } from '@/providers/lens/metadata/post/metadataDetailsWith.js';
import { postWith } from '@/providers/lens/metadata/post/postWith.js';
import type { PartialWith } from '@/types/utility.js';

type TextOnlyMetadataDetails = PostMetadataCommon & {
    mainContentFocus: PostMainFocus.TEXT_ONLY;
    content: string;
};
type TextOnlyDetails = PartialWith<Omit<TextOnlyMetadataDetails, 'mainContentFocus'>, 'id' | 'locale'>;
type TextOnlyOptions = TextOnlyDetails & {
    nft?: NftDetails;
};
type TextOnlyMetadata = NftMetadata & {
    $schema: PostMetadataSchemaId.TEXT_ONLY_LATEST;
    lens: TextOnlyMetadataDetails;
    signature?: string;
};

const TextOnlyMetadataDetailsSchema: z.ZodType<TextOnlyMetadataDetails, z.ZodTypeDef, object> = metadataDetailsWith({
    mainContentFocus: mainContentFocus(PostMainFocus.TEXT_ONLY),
    content: NonEmptyStringSchema,
});
const TextOnlySchema = postWith({
    $schema: z.literal(PostMetadataSchemaId.TEXT_ONLY_LATEST),
    lens: TextOnlyMetadataDetailsSchema,
});

export function textOnly({
    nft,
    locale = DEFAULT_LOCALE,
    id = crypto.randomUUID(),
    ...others
}: TextOnlyOptions): TextOnlyMetadata {
    return evaluate(
        TextOnlySchema.safeParse({
            $schema: PostMetadataSchemaId.TEXT_ONLY_LATEST,
            ...nft,
            lens: {
                id,
                locale,
                mainContentFocus: PostMainFocus.TEXT_ONLY,
                ...others,
            },
        }),
    );
}
