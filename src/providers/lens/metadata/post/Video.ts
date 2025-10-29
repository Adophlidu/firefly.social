import { z } from 'zod';

import { NonEmptyStringSchema } from '@/providers/lens/metadata/Base.js';
import { evaluate } from '@/providers/lens/metadata/evaluate.js';
import {
    type AnyMedia,
    AnyMediaSchema,
    DEFAULT_LOCALE,
    type MediaVideo,
    MediaVideoSchema,
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

type VideoMetadataDetails = PostMetadataCommon & {
    mainContentFocus: PostMainFocus.VIDEO | PostMainFocus.SHORT_VIDEO;
    video: MediaVideo;
    title?: string;
    content?: string;
    attachments?: AnyMedia[];
};
type VideoDetails = PartialWith<Omit<VideoMetadataDetails, 'mainContentFocus'>, 'id' | 'locale'>;
type VideoOptions = VideoDetails & {
    nft?: NftDetails;
};
type VideoMetadata = NftMetadata & {
    $schema: PostMetadataSchemaId.VIDEO_LATEST;
    lens: VideoMetadataDetails;
    signature?: string;
};

const VideoMetadataDetailsSchema: z.ZodType<VideoMetadataDetails, z.ZodTypeDef, object> = metadataDetailsWith({
    mainContentFocus: mainContentFocus(PostMainFocus.SHORT_VIDEO, PostMainFocus.VIDEO),
    video: MediaVideoSchema,
    title: NonEmptyStringSchema.optional(),
    content: NonEmptyStringSchema.optional(),
    attachments: AnyMediaSchema.array().min(1).optional(),
});
const VideoSchema = postWith({
    $schema: z.literal(PostMetadataSchemaId.VIDEO_LATEST),
    lens: VideoMetadataDetailsSchema,
});

export function video({
    nft,
    locale = DEFAULT_LOCALE,
    id = crypto.randomUUID(),
    ...others
}: VideoOptions): VideoMetadata {
    return evaluate(
        VideoSchema.safeParse({
            $schema: PostMetadataSchemaId.VIDEO_LATEST,
            ...nft,
            lens: {
                id,
                locale,
                mainContentFocus: PostMainFocus.VIDEO,
                ...others,
            },
        }),
    );
}
