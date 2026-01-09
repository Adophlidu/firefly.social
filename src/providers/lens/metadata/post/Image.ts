import { z } from 'zod';

import { NonEmptyStringSchema } from '@/providers/lens/metadata/Base.js';
import { evaluate } from '@/providers/lens/metadata/evaluate.js';
import {
    type AnyMedia,
    AnyMediaSchema,
    DEFAULT_LOCALE,
    type MediaImage,
    MediaImageSchema,
    type NftDetails,
    type NftMetadata,
    PostMainFocus,
    type PostMetadataCommon,
    PostMetadataSchemaId,
} from '@/providers/lens/metadata/post/Base.js';
import { mainContentFocus } from '@/providers/lens/metadata/post/mainContentFocus.js';
import { metadataDetailsWith } from '@/providers/lens/metadata/post/metadataDetailsWith.js';
import { postWith } from '@/providers/lens/metadata/post/postWith.js';
import { type PartialWith } from '@/types/utility.js';

type ImageMetadataDetails = PostMetadataCommon & {
    mainContentFocus: PostMainFocus.IMAGE;
    image: MediaImage;
    title?: string;
    content?: string;
    attachments?: AnyMedia[];
};
type ImageDetails = PartialWith<Omit<ImageMetadataDetails, 'mainContentFocus'>, 'id' | 'locale'>;
type ImageOptions = ImageDetails & {
    nft?: NftDetails;
};
type ImageMetadata = NftMetadata & {
    $schema: PostMetadataSchemaId.IMAGE_LATEST;
    lens: ImageMetadataDetails;
    signature?: string;
};

const ImageMetadataDetailsSchema: z.ZodType<ImageMetadataDetails, z.ZodTypeDef, object> = metadataDetailsWith({
    mainContentFocus: mainContentFocus(PostMainFocus.IMAGE),
    image: MediaImageSchema,
    title: NonEmptyStringSchema.optional(),
    content: NonEmptyStringSchema.optional(),
    attachments: AnyMediaSchema.array().min(1).optional(),
});
const ImageSchema = postWith({
    $schema: z.literal(PostMetadataSchemaId.IMAGE_LATEST),
    lens: ImageMetadataDetailsSchema,
});

export function image({
    nft,
    locale = DEFAULT_LOCALE,
    id = crypto.randomUUID(),
    ...others
}: ImageOptions): ImageMetadata {
    return evaluate(
        ImageSchema.safeParse({
            $schema: PostMetadataSchemaId.IMAGE_LATEST,
            ...nft,
            lens: {
                id,
                locale,
                mainContentFocus: PostMainFocus.IMAGE,
                ...others,
            },
        }),
    );
}
