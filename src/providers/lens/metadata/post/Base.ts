import { z } from 'zod';

import {
    type MetadataAttribute,
    MetadataAttributeSchema,
    NonEmptyStringSchema,
    URISchema,
} from '@/providers/lens/metadata/Base.js';

// #region constant
export const DEFAULT_LOCALE = 'en';
const localeRegex = /^[a-z]{2}(?:-[a-zA-Z]{2})?$/;
const localeLikeRegex = /^([a-z]{2})(?:-[A-Z0-9]{2,3})?$/i;
// #endregion

// #region enum
enum ContentWarning {
    NSFW = 'NSFW',
    SENSITIVE = 'SENSITIVE',
    SPOILER = 'SPOILER',
}
export enum PostMainFocus {
    VIDEO = 'VIDEO',
    IMAGE = 'IMAGE',
    ARTICLE = 'ARTICLE',
    TEXT_ONLY = 'TEXT_ONLY',
    AUDIO = 'AUDIO',
    LINK = 'LINK',
    EMBED = 'EMBED',
    CHECKING_IN = 'CHECKING_IN',
    EVENT = 'EVENT',
    MINT = 'MINT',
    TRANSACTION = 'TRANSACTION',
    LIVESTREAM = 'LIVESTREAM',
    SHORT_VIDEO = 'SHORT_VIDEO',
    THREE_D = '3D',
    STORY = 'STORY',
    SPACE = 'SPACE',
}
export enum PostMetadataSchemaId {
    THREE_D_LATEST = 'https://json-schemas.lens.dev/posts/3d/3.0.0.json',
    ARTICLE_LATEST = 'https://json-schemas.lens.dev/posts/article/3.0.0.json',
    AUDIO_LATEST = 'https://json-schemas.lens.dev/posts/audio/3.0.0.json',
    CHECKING_IN_LATEST = 'https://json-schemas.lens.dev/posts/checking-in/3.0.0.json',
    EMBED_LATEST = 'https://json-schemas.lens.dev/posts/embed/3.0.0.json',
    EVENT_LATEST = 'https://json-schemas.lens.dev/posts/event/3.0.0.json',
    IMAGE_LATEST = 'https://json-schemas.lens.dev/posts/image/3.0.0.json',
    LINK_LATEST = 'https://json-schemas.lens.dev/posts/link/3.0.0.json',
    LIVESTREAM_LATEST = 'https://json-schemas.lens.dev/posts/livestream/3.0.0.json',
    MINT_LATEST = 'https://json-schemas.lens.dev/posts/mint/3.0.0.json',
    SPACE_LATEST = 'https://json-schemas.lens.dev/posts/space/3.0.0.json',
    STORY_LATEST = 'https://json-schemas.lens.dev/posts/story/3.0.0.json',
    TRANSACTION_LATEST = 'https://json-schemas.lens.dev/posts/transaction/3.0.0.json',
    TEXT_ONLY_LATEST = 'https://json-schemas.lens.dev/posts/text-only/3.0.0.json',
    VIDEO_LATEST = 'https://json-schemas.lens.dev/posts/video/3.0.0.json',
}
enum NftMetadataAttributeDisplayType {
    NUMBER = 'number',
    STRING = 'string',
    DATE = 'date',
}
enum MetadataLicenseType {
    CCO = 'CCO',
    CC_BY = 'CC BY',
    CC_BY_ND = 'CC BY-ND',
    CC_BY_NC = 'CC BY-NC',
    TBNL_C_D_PL_Legal = 'TBNL-C-D-PL-Legal',
    TBNL_C_DT_PL_Legal = 'TBNL-C-DT-PL-Legal',
    TBNL_C_ND_PL_Legal = 'TBNL-C-ND-PL-Legal',
    TBNL_C_D_NPL_Legal = 'TBNL-C-D-NPL-Legal',
    TBNL_C_DT_NPL_Legal = 'TBNL-C-DT-NPL-Legal',
    TBNL_C_DTSA_PL_Legal = 'TBNL-C-DTSA-PL-Legal',
    TBNL_C_DTSA_NPL_Legal = 'TBNL-C-DTSA-NPL-Legal',
    TBNL_C_ND_NPL_Legal = 'TBNL-C-ND-NPL-Legal',
    TBNL_C_D_PL_Ledger = 'TBNL-C-D-PL-Ledger',
    TBNL_C_DT_PL_Ledger = 'TBNL-C-DT-PL-Ledger',
    TBNL_C_ND_PL_Ledger = 'TBNL-C-ND-PL-Ledger',
    TBNL_C_D_NPL_Ledger = 'TBNL-C-D-NPL-Ledger',
    TBNL_C_DT_NPL_Ledger = 'TBNL-C-DT-NPL-Ledger',
    TBNL_C_DTSA_PL_Ledger = 'TBNL-C-DTSA-PL-Ledger',
    TBNL_C_DTSA_NPL_Ledger = 'TBNL-C-DTSA-NPL-Ledger',
    TBNL_C_ND_NPL_Ledger = 'TBNL-C-ND-NPL-Ledger',
    TBNL_NC_D_PL_Legal = 'TBNL-NC-D-PL-Legal',
    TBNL_NC_DT_PL_Legal = 'TBNL-NC-DT-PL-Legal',
    TBNL_NC_ND_PL_Legal = 'TBNL-NC-ND-PL-Legal',
    TBNL_NC_D_NPL_Legal = 'TBNL-NC-D-NPL-Legal',
    TBNL_NC_DT_NPL_Legal = 'TBNL-NC-DT-NPL-Legal',
    TBNL_NC_DTSA_PL_Legal = 'TBNL-NC-DTSA-PL-Legal',
    TBNL_NC_DTSA_NPL_Legal = 'TBNL-NC-DTSA-NPL-Legal',
    TBNL_NC_ND_NPL_Legal = 'TBNL-NC-ND-NPL-Legal',
    TBNL_NC_D_PL_Ledger = 'TBNL-NC-D-PL-Ledger',
    TBNL_NC_DT_PL_Ledger = 'TBNL-NC-DT-PL-Ledger',
    TBNL_NC_ND_PL_Ledger = 'TBNL-NC-ND-PL-Ledger',
    TBNL_NC_D_NPL_Ledger = 'TBNL-NC-D-NPL-Ledger',
    TBNL_NC_DT_NPL_Ledger = 'TBNL-NC-DT-NPL-Ledger',
    TBNL_NC_DTSA_PL_Ledger = 'TBNL-NC-DTSA-PL-Ledger',
    TBNL_NC_DTSA_NPL_Ledger = 'TBNL-NC-DTSA-NPL-Ledger',
    TBNL_NC_ND_NPL_Ledger = 'TBNL-NC-ND-NPL-Ledger',
}
export enum MediaImageMimeType {
    AVIF = 'image/avif',
    BMP = 'image/bmp',
    GIF = 'image/gif',
    HEIC = 'image/heic',
    JPEG = 'image/jpeg',
    PNG = 'image/png',
    SVG_XML = 'image/svg+xml',
    TIFF = 'image/tiff',
    WEBP = 'image/webp',
    X_MS_BMP = 'image/x-ms-bmp',
}
enum MediaAudioMimeType {
    WAV = 'audio/wav',
    WAV_VND = 'audio/vnd.wave',
    MP3 = 'audio/mpeg',
    OGG_AUDIO = 'audio/ogg',
    MP4_AUDIO = 'audio/mp4',
    AAC = 'audio/aac',
    WEBM_AUDIO = 'audio/webm',
    FLAC = 'audio/flac',
}
enum MediaAudioKind {
    MUSIC = 'MUSIC',
    PODCAST = 'PODCAST',
    AUDIOBOOK = 'AUDIOBOOK',
    VOICE_NOTE = 'VOICE_NOTE',
    SOUND = 'SOUND',
    OTHER = 'OTHER',
}
export enum MediaVideoMimeType {
    GLTF = 'model/gltf+json',
    GLTF_BINARY = 'model/gltf-binary',
    M4V = 'video/x-m4v',
    MOV = 'video/mov',
    MP4 = 'video/mp4',
    MPEG = 'video/mpeg',
    OGG = 'video/ogg',
    OGV = 'video/ogv',
    QUICKTIME = 'video/quicktime',
    WEBM = 'video/webm',
}
// #endregion

// #region schema
function mediaCommonSchema<Augmentation extends z.ZodRawShape>(augmentation: Augmentation) {
    return z
        .object({
            item: URISchema,
            attributes: MetadataAttributeSchema.array().min(1).optional(),
        })
        .extend(augmentation);
}
const MediaLikeShape = z.object({
    type: z.string(),
});
function hasMediaLikeShape(val: unknown): val is z.infer<typeof MediaLikeShape> {
    return MediaLikeShape.safeParse(val).success;
}
function resolveAnyMediaSchema(val: unknown) {
    if (!hasMediaLikeShape(val)) return MediaLikeShape;

    switch (val.type) {
        case MediaAudioMimeType.WAV:
        case MediaAudioMimeType.WAV_VND:
        case MediaAudioMimeType.MP3:
        case MediaAudioMimeType.OGG_AUDIO:
        case MediaAudioMimeType.MP4_AUDIO:
        case MediaAudioMimeType.AAC:
        case MediaAudioMimeType.WEBM_AUDIO:
        case MediaAudioMimeType.FLAC:
            return MediaAudioSchema;
        case MediaImageMimeType.BMP:
        case MediaImageMimeType.GIF:
        case MediaImageMimeType.HEIC:
        case MediaImageMimeType.JPEG:
        case MediaImageMimeType.PNG:
        case MediaImageMimeType.SVG_XML:
        case MediaImageMimeType.TIFF:
        case MediaImageMimeType.WEBP:
        case MediaImageMimeType.X_MS_BMP:
            return MediaImageSchema;
        case MediaVideoMimeType.GLTF:
        case MediaVideoMimeType.GLTF_BINARY:
        case MediaVideoMimeType.M4V:
        case MediaVideoMimeType.MOV:
        case MediaVideoMimeType.MP4:
        case MediaVideoMimeType.MPEG:
        case MediaVideoMimeType.OGG:
        case MediaVideoMimeType.OGV:
        case MediaVideoMimeType.QUICKTIME:
        case MediaVideoMimeType.WEBM:
            return MediaVideoSchema;
    }

    return null;
}

export const MetadataIdSchema = NonEmptyStringSchema;
const LocaleRegexSchema = z.string().regex(localeRegex, 'Should be a valid Locale Identifier.');
export const LocaleSchema: z.ZodType<string, z.ZodTypeDef, unknown> = LocaleRegexSchema.catch((ctx) => {
    // attempts to recover the language code at least
    const match = localeLikeRegex.exec(ctx.input);
    if (match) {
        return match[1] as string;
    }
    return ctx.input;
});
export const TagSchema: z.ZodType<string, z.ZodTypeDef, string> = z
    .string()
    .min(1)
    .max(50)
    .transform((value) => value.toLowerCase());
export const ContentWarningSchema = z.nativeEnum(ContentWarning);
export const Nft721MetadataAttributeSchema: z.ZodType<NftMetadataAttribute, z.ZodTypeDef, object> = z
    .object({
        display_type: z.nativeEnum(NftMetadataAttributeDisplayType).optional(),
        trait_type: NonEmptyStringSchema.optional(),
        value: z.union([z.string(), z.number()]).optional(),
    })
    .passthrough();
const MetadataLicenseTypeSchema = z.nativeEnum(MetadataLicenseType);
export const MediaImageSchema = mediaCommonSchema({
    type: z.nativeEnum(MediaImageMimeType),
    altTag: NonEmptyStringSchema.optional(),
    license: MetadataLicenseTypeSchema.optional(),
});
const MediaAudioSchema = mediaCommonSchema({
    type: z.nativeEnum(MediaAudioMimeType),
    cover: URISchema.optional(),
    duration: z.number().positive().int().optional(),
    license: MetadataLicenseTypeSchema.optional(),
    credits: NonEmptyStringSchema.optional(),
    artist: NonEmptyStringSchema.optional(),
    genre: NonEmptyStringSchema.optional(),
    recordLabel: NonEmptyStringSchema.optional(),
    kind: z.nativeEnum(MediaAudioKind).optional(),
    lyrics: URISchema.optional(),
});
export const MediaVideoSchema = mediaCommonSchema({
    type: z.nativeEnum(MediaVideoMimeType),
    altTag: NonEmptyStringSchema.optional(),
    cover: URISchema.optional(),
    duration: z.number().positive().int().optional(),
    license: MetadataLicenseTypeSchema.optional(),
});
export const AnyMediaSchema: z.ZodType<AnyMedia, z.ZodTypeDef, unknown> = z
    .discriminatedUnion('type', [MediaAudioSchema, MediaImageSchema, MediaVideoSchema])
    .catch((ctx) => ctx.input as AnyMedia)
    .superRefine((val: unknown, ctx): val is AnyMedia => {
        const schema = resolveAnyMediaSchema(val);

        if (!schema) {
            ctx.addIssue({
                code: z.ZodIssueCode.invalid_union_discriminator,
                options: [
                    ...new Set(
                        [
                            Object.values(MediaAudioMimeType),
                            Object.values(MediaImageMimeType),
                            Object.values(MediaVideoMimeType),
                        ].flat(),
                    ),
                ],
                message:
                    'Invalid discriminator value. Expected one of `MediaAudioMimeType`, `MediaImageMimeType`, `MediaVideoMimeType` values.',
            });
            return z.NEVER;
        }

        const result = schema.safeParse(val);

        if (!result.success) {
            for (const issue of result.error.issues) {
                ctx.addIssue(issue);
            }
        }

        return z.NEVER;
    });
// #endregion

// #region types
export interface PostMetadataCommon {
    id: string;
    attributes?: MetadataAttribute[];
    locale: string;
    tags?: string[];
    contentWarning?: ContentWarning;
}
interface NftMetadataAttribute {
    value?: string | number;
    display_type?: NftMetadataAttributeDisplayType;
    trait_type?: string;
}
export interface NftMetadata {
    description?: string | null;
    external_url?: string | null;
    name?: string;
    attributes?: NftMetadataAttribute[];
    image?: string | null;
    animation_url?: string | null;
}
export type NftDetails = NftMetadata;
export interface MediaImage {
    item: string;
    attributes?: MetadataAttribute[];
    type: MediaImageMimeType;
    altTag?: string;
    license?: MetadataLicenseType;
}
interface MediaAudio {
    item: string;
    attributes?: MetadataAttribute[];
    type: MediaAudioMimeType;
    cover?: string;
    duration?: number;
    license?: MetadataLicenseType;
    credits?: string;
    artist?: string;
    genre?: string;
    recordLabel?: string;
    kind?: MediaAudioKind;
    lyrics?: string;
}
export interface MediaVideo {
    item: string;
    attributes?: MetadataAttribute[];
    type: MediaVideoMimeType;
    altTag?: string;
    cover?: string;
    duration?: number;
    license?: MetadataLicenseType;
}
export type AnyMedia = MediaAudio | MediaImage | MediaVideo;
// #endregion
