import { z } from 'zod';

import { NonEmptyStringSchema, URISchema } from '@/providers/lens/metadata/Base.js';
import { evaluate } from '@/providers/lens/metadata/evaluate.js';
import {
    type AnyMedia,
    AnyMediaSchema,
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

type LinkMetadataDetails = PostMetadataCommon & {
    mainContentFocus: PostMainFocus.LINK;
    sharingLink: string;
    content?: string;
    attachments?: AnyMedia[];
};
type LinkDetails = PartialWith<Omit<LinkMetadataDetails, 'mainContentFocus'>, 'id' | 'locale'>;
type LinkOptions = LinkDetails & {
    nft?: NftDetails;
};
type LinkMetadata = NftMetadata & {
    $schema: PostMetadataSchemaId.LINK_LATEST;
    lens: LinkMetadataDetails;
    signature?: string;
};

const LinkMetadataDetailsSchema: z.ZodType<LinkMetadataDetails, z.ZodTypeDef, object> = metadataDetailsWith({
    mainContentFocus: mainContentFocus(PostMainFocus.LINK),
    sharingLink: URISchema,
    content: NonEmptyStringSchema.optional(),
    attachments: AnyMediaSchema.array().min(1).optional(),
});
const LinkSchema = postWith({
    $schema: z.literal(PostMetadataSchemaId.LINK_LATEST),
    lens: LinkMetadataDetailsSchema,
});

export function link({ nft, locale = DEFAULT_LOCALE, id = crypto.randomUUID(), ...others }: LinkOptions): LinkMetadata {
    return evaluate(
        LinkSchema.safeParse({
            $schema: PostMetadataSchemaId.LINK_LATEST,
            ...nft,
            lens: {
                id,
                locale,
                mainContentFocus: PostMainFocus.LINK,
                ...others,
            },
        }),
    );
}
