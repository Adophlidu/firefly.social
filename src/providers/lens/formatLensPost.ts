import { safeUnreachable } from '@dimensiondev/utils';
import {
    type AnyMedia,
    type AnyPost,
    type FullPostMetadata,
    type Post as LensPost,
    type PostAction,
    type PostMention,
    type TextOnlyMetadata,
    type TimelineItem,
} from '@lens-protocol/client';
import { compact, first, isEmpty, last, uniqBy } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { URL_REGEX } from '@/constants/regexp.js';
import { formatLensImageUrl } from '@/helpers/formatImageUrl.js';
import { getEmbedUrls } from '@/helpers/getEmbedUrls.js';
import { getPollFrameUrl } from '@/helpers/getPollFrameUrl.js';
import { resolveSizeFromS3Url } from '@/helpers/resolveSizeFromS3Url.js';
import { formatLensChannelFromPostGroup } from '@/providers/lens/formatLensChannel.js';
import {
    formatLensMediaAudioMimeType,
    formatLensMediaImageMimeType,
    formatLensMediaVideoMimeType,
} from '@/providers/lens/formatLensMediaType.js';
import { formatLensPostOperations, formatLensPostStats } from '@/providers/lens/formatLensPostStatsAndOperations.js';
import { formatLensProfileByMention, formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { isMutedLensAccount } from '@/providers/lens/isMutedLensAccount.js';
import { LensMetadataAttributeKey } from '@/providers/types/Lens.js';
import type { Attachment, MediaObject, Post, PostType, Profile } from '@/providers/types/SocialMedia.js';

const PLACEHOLDER_IMAGE = 'https://static-assets.hey.xyz/images/placeholder.webp';

function formatCollectModuleV3(postActions: PostAction[], count: number) {
    const collectAction = postActions.find((action) => action.__typename === 'SimpleCollectAction');
    if (!collectAction) return;

    return {
        collectedCount: count,
        collectLimit: collectAction.collectLimit || 0,
        currency: collectAction.payToCollect?.amount?.asset.symbol,
        assetAddress: collectAction.payToCollect?.amount?.asset.contract.address,
        usdPrice: '',
        amount: Number.parseFloat(collectAction.payToCollect?.amount?.value || '0'),
        referralFee: collectAction.payToCollect?.referralShare ?? undefined,
        followerOnly: collectAction.followerOnGraph?.globalGraph,
        contract: {
            address: collectAction.address,
            chainId: collectAction.payToCollect?.amount.asset.contract.chainId,
        },
        endsAt: collectAction.endsAt,
    };
}

function getAttachmentsV3(attachments?: AnyMedia[] | null) {
    if (!attachments) return EMPTY_LIST;

    return compact<Attachment>(
        attachments.map((attachment) => {
            const type = attachment.__typename;
            switch (type) {
                case 'MediaImage':
                    if (attachment.item) {
                        return {
                            uri: formatLensImageUrl(attachment.item),
                            type: 'Image',
                        };
                    }
                    return;
                case 'MediaVideo':
                    if (attachment.item) {
                        return {
                            uri: formatLensImageUrl(attachment.item),
                            coverUri: formatLensImageUrl(attachment.cover),
                            type: 'Video',
                            ...resolveSizeFromS3Url(attachment.item),
                        };
                    }
                    return;
                case 'MediaAudio':
                    if (attachment.item) {
                        return {
                            uri: formatLensImageUrl(attachment.item),
                            coverUri: formatLensImageUrl(attachment.cover),
                            artist: attachment.artist ?? undefined,
                            type: 'Audio',
                        };
                    }
                    return;
                default:
                    safeUnreachable(type);
                    return;
            }
        }),
    );
}

function getOembedUrlsV3(metadata: TextOnlyMetadata, author: Profile): string[] {
    return getEmbedUrls(
        metadata.content,
        metadata.attributes?.reduce<string[]>((acc, attr) => {
            if (attr.key === LensMetadataAttributeKey.Poll) {
                acc.push(getPollFrameUrl(attr.value, undefined, author));
            }
            return acc;
        }, []) ?? [],
    );
}

function updateContent(content: string, mentions: PostMention[]) {
    if (!content?.trim() || !mentions.length) return content;

    return mentions.reduce((updated, mention) => {
        switch (mention.__typename) {
            case 'AccountMention':
            case 'GroupMention':
                return updated.replace(mention.replace.from, mention.replace.to);
            default:
                safeUnreachable(mention);
                return updated;
        }
    }, content);
}

function formatContentV3(metadata: FullPostMetadata, author: Profile, mentions: PostMention[]) {
    if (!metadata.__typename) return null;

    const typeName = metadata.__typename;
    switch (typeName) {
        case 'ArticleMetadata':
            return {
                content: updateContent(metadata.content, mentions),
                attachments: getAttachmentsV3(metadata.attachments),
            };
        case 'TextOnlyMetadata':
            return {
                content: updateContent(metadata.content, mentions),
                oembedUrls: getOembedUrlsV3(metadata, author),
            };
        case 'LinkMetadata':
            return null;
        case 'ImageMetadata': {
            const asset = metadata.image?.item
                ? ({
                      uri: formatLensImageUrl(metadata.image.item),
                      type: 'Image',
                      title: metadata.image.altTag || metadata.title || '',
                  } satisfies Attachment)
                : undefined;

            return {
                content: updateContent(metadata.content, mentions),
                asset,
                attachments: metadata.attachments?.length
                    ? uniqBy(compact([asset, ...getAttachmentsV3(metadata.attachments)]), (x) => x.uri)
                    : asset
                      ? [asset]
                      : [],
            };
        }
        case 'AudioMetadata': {
            const audioAttachments = getAttachmentsV3(metadata.attachments)[0];
            const asset = {
                uri: formatLensImageUrl(metadata.audio.item || audioAttachments?.uri),
                coverUri: formatLensImageUrl(metadata.audio.cover || audioAttachments?.coverUri || PLACEHOLDER_IMAGE),
                artist: metadata.audio.artist || audioAttachments?.artist,
                title: metadata.title || '',
                type: 'Audio',
            } satisfies Attachment;

            return {
                content: updateContent(metadata.content, mentions),
                asset,
                attachments: [asset],
            };
        }
        case 'VideoMetadata': {
            const videoAttachment = first(getAttachmentsV3(metadata.attachments));
            const videoUrl = metadata.video.item || videoAttachment?.uri;
            if (!videoUrl) return null;

            const asset = {
                uri: formatLensImageUrl(videoUrl),
                coverUri: formatLensImageUrl(metadata.video.cover || videoAttachment?.coverUri || PLACEHOLDER_IMAGE),
                type: 'Video',
                ...resolveSizeFromS3Url(videoUrl),
            } satisfies Attachment;

            return {
                content: updateContent(metadata.content, mentions),
                asset,
                attachments: [asset],
            };
        }
        case 'MintMetadata':
            return {
                content: updateContent(metadata.content, mentions),
                attachments: getAttachmentsV3(metadata.attachments),
            };
        case 'EmbedMetadata':
            return {
                content: updateContent(metadata.content, mentions),
                attachments: getAttachmentsV3(metadata.attachments),
            };
        case 'LivestreamMetadata':
            return {
                content: updateContent(metadata.content, mentions),
                attachments: getAttachmentsV3(metadata.attachments),
            };
        case 'CheckingInMetadata':
        case 'EventMetadata':
        case 'SpaceMetadata':
        case 'StoryMetadata':
        case 'ThreeDMetadata':
        case 'TransactionMetadata':
        case 'UnknownPostMetadata':
            return null;
        default:
            safeUnreachable(typeName);
            return null;
    }
}

function getMediaObjectsV3(metadata: FullPostMetadata): MediaObject[] | undefined {
    const typename = metadata.__typename;
    if (!typename) return;

    switch (typename) {
        case 'ArticleMetadata':
        case 'AudioMetadata':
        case 'CheckingInMetadata':
        case 'EmbedMetadata':
        case 'EventMetadata':
        case 'ImageMetadata':
        case 'LivestreamMetadata':
        case 'MintMetadata':
        case 'SpaceMetadata':
        case 'ThreeDMetadata':
        case 'TransactionMetadata':
        case 'VideoMetadata':
            return metadata.attachments.map((attachment) => {
                const type = attachment.__typename;
                switch (type) {
                    case 'MediaAudio':
                        return {
                            url: formatLensImageUrl(attachment.item),
                            mimeType: formatLensMediaAudioMimeType(attachment.type),
                        };
                    case 'MediaImage':
                        return {
                            url: formatLensImageUrl(attachment.item),
                            mimeType: formatLensMediaImageMimeType(attachment.type),
                        };
                    case 'MediaVideo':
                        return {
                            url: formatLensImageUrl(attachment.item),
                            mimeType: formatLensMediaVideoMimeType(attachment.type),
                            ...resolveSizeFromS3Url(attachment.item),
                        };
                    default:
                        safeUnreachable(type);
                        return {
                            url: '',
                            mimeType: '',
                        };
                }
            });
        case 'LinkMetadata':
        case 'TextOnlyMetadata':
        case 'StoryMetadata':
        case 'UnknownPostMetadata':
            return;
        default:
            safeUnreachable(typename);
            return;
    }
}

export function formatLensQuoteOrCommentV3(
    result: LensPost['quoteOf'] | LensPost['commentOn'],
    type?: PostType,
): Post | undefined {
    if (!result) return;

    const profile = formatLensProfileV3(result?.author);
    const timestamp = new Date(result.timestamp).getTime();

    const mediaObjects = getMediaObjectsV3(result.metadata);
    const mentions = formatLensMentions(result.mentions);

    return {
        publicationId: result.id,
        type: type || result.__typename,
        source: Source.Lens,
        postId: result.id,
        slug: result.slug,
        timestamp,
        author: profile,
        mediaObjects,
        isHidden: result.isDeleted,
        isEncrypted: false, // TODO
        metadata: {
            locale: getPostLocale(result.metadata),
            content: formatContentV3(result.metadata, profile, result.mentions),
            contentURI: result.contentUri,
        },

        ...formatLensPostOperations(result.operations, result.actions),
        stats: formatLensPostStats(result.stats),
        channel: result.feed.group ? formatLensChannelFromPostGroup(result.feed.group) : undefined,
        mentions: mentions.profiles,
        groups: mentions.groups,
        collectModule: formatCollectModuleV3(result.actions, result.stats.collects),
        __original__: result,
        momoka: undefined,
        sendFrom: result.app?.metadata?.name
            ? {
                  displayName: result.app.metadata.name,
                  name: result.app.metadata.name,
              }
            : undefined,
    };
}

function getPostLocale(metadata: FullPostMetadata) {
    if (!metadata.__typename) return 'en';

    switch (metadata.__typename) {
        case 'TextOnlyMetadata':
        case 'ArticleMetadata':
        case 'ImageMetadata':
        case 'AudioMetadata':
        case 'CheckingInMetadata':
        case 'EmbedMetadata':
        case 'EventMetadata':
        case 'LivestreamMetadata':
        case 'MintMetadata':
        case 'SpaceMetadata':
        case 'StoryMetadata':
        case 'ThreeDMetadata':
        case 'TransactionMetadata':
        case 'VideoMetadata':
            return (metadata.locale || 'en') as string;
        case 'LinkMetadata':
        case 'UnknownPostMetadata':
            return 'en';
        default:
            safeUnreachable(metadata.__typename);
            return 'en';
    }
}

/**
 * Remove feeds that posted by muted users.
 */
export function filterFeedsV3(posts: AnyPost[] | readonly AnyPost[]): AnyPost[] {
    return posts.filter((x) => {
        switch (x.__typename) {
            case 'Post':
                return !isMutedLensAccount(x.author) && !x.operations?.hasReported;
            case 'Repost':
                return !isMutedLensAccount(x.author);
            default:
                safeUnreachable(x);
                return false;
        }
    });
}

function formatLensMentions(mentions: PostMention[]) {
    const profiles: Profile[] = [];
    const groups: Post['groups'] = [];

    mentions.forEach((mention) => {
        switch (mention.__typename) {
            case 'AccountMention':
                profiles.push(formatLensProfileByMention(mention));
                break;
            case 'GroupMention':
                groups.push({
                    id: mention.group,
                    name: mention.replace.to,
                });
                break;
            default:
                safeUnreachable(mention);
                break;
        }
    });

    return { profiles, groups };
}

export function formatLensPostV3(result: AnyPost): Post {
    if (result.__typename === 'Repost') {
        const mirrorOn = result.repostOf?.__typename === 'Post' ? (result.repostOf as LensPost) : undefined;
        if (!mirrorOn) throw new Error('No root post found');

        const mediaObjects = getMediaObjectsV3(mirrorOn.metadata);
        const mirrorOnProfile = formatLensProfileV3(mirrorOn.author);
        const content = formatContentV3(mirrorOn.metadata, mirrorOnProfile, mirrorOn.mentions);
        const oembedUrls = getEmbedUrls(content?.content ?? '', []);
        const mentions = formatLensMentions(mirrorOn.mentions);

        return {
            publicationId: result.id,
            type: 'Mirror',
            postId: mirrorOn.id,
            slug: mirrorOn.slug,
            timestamp: new Date(result.timestamp).getTime(),
            author: mirrorOnProfile,
            reporter: formatLensProfileV3(result.author),
            isHidden: mirrorOn.isDeleted,
            source: Source.Lens,
            mediaObjects,
            metadata: {
                locale: getPostLocale(mirrorOn.metadata),
                content: {
                    ...content,
                    oembedUrl: last(oembedUrls),
                },
                contentURI: mirrorOn.contentUri,
            },
            stats: formatLensPostStats(mirrorOn.stats),
            ...formatLensPostOperations(mirrorOn.operations, mirrorOn.actions),
            mentions: mentions.profiles,
            groups: mentions.groups,
            collectModule: formatCollectModuleV3(mirrorOn.actions, mirrorOn.stats.collects),
            __original__: result,
            sendFrom: mirrorOn.app?.metadata?.name
                ? {
                      displayName: mirrorOn.app.metadata.name,
                      name: mirrorOn.app.metadata.name,
                  }
                : undefined,
            momoka: undefined,
            channel: mirrorOn.feed.group ? formatLensChannelFromPostGroup(mirrorOn.feed.group) : undefined,
        };
    }

    if (result.metadata.__typename === 'EventMetadata') throw new Error('Event not supported');

    const profile = formatLensProfileV3(result.author);
    const timestamp = new Date(result.timestamp).getTime();

    const mediaObjects = getMediaObjectsV3(result.metadata);
    const content = formatContentV3(result.metadata, profile, result.mentions);
    const oembedUrl = last(content?.oembedUrls || content?.content.match(URL_REGEX) || []);
    const mentions = formatLensMentions(result.mentions);
    const locale = getPostLocale(result.metadata);
    const channel = result.feed.group ? formatLensChannelFromPostGroup(result.feed.group) : undefined;

    if (result.quoteOf) {
        return {
            publicationId: result.id,
            type: result.__typename,
            source: Source.Lens,
            postId: result.id,
            slug: result.slug,
            timestamp,
            author: profile,
            mediaObjects,
            isHidden: result.isDeleted,
            isEncrypted: false, // TODO
            metadata: {
                locale,
                content: {
                    ...content,
                    oembedUrl,
                },
                contentURI: result.contentUri,
            },
            stats: formatLensPostStats(result.stats),
            ...formatLensPostOperations(result.operations, result.actions),
            __original__: result,
            quoteOn: formatLensQuoteOrCommentV3(result.quoteOf),
            mentions: mentions.profiles,
            groups: mentions.groups,
            collectModule: formatCollectModuleV3(result.actions, result.stats.collects),
            momoka: undefined,
            sendFrom: result.app?.metadata?.name
                ? {
                      displayName: result.app.metadata.name,
                      name: result.app.metadata.name,
                  }
                : undefined,
            channel,
        };
    } else if (result.commentOn) {
        return {
            publicationId: result.id,
            type: 'Comment',
            source: Source.Lens,
            postId: result.id,
            slug: result.slug,
            timestamp,
            author: profile,
            mediaObjects,
            isHidden: result.isDeleted,
            isEncrypted: false, // TODO
            metadata: {
                locale,
                content: {
                    ...content,
                    oembedUrl,
                },
                contentURI: result.contentUri,
            },
            stats: formatLensPostStats(result.stats),
            ...formatLensPostOperations(result.operations, result.actions),
            __original__: result,
            commentOn: formatLensQuoteOrCommentV3(result.commentOn),
            firstComment: undefined,
            mentions: mentions.profiles,
            groups: mentions.groups,
            root:
                result.root && !isEmpty(result.root) && result.root.id !== result.commentOn.id
                    ? formatLensPostV3(result.root as AnyPost)
                    : undefined,
            collectModule: formatCollectModuleV3(result.actions, result.stats.collects),
            momoka: undefined,
            sendFrom: result.app?.metadata?.name
                ? {
                      displayName: result.app.metadata.name,
                      name: result.app.metadata.name,
                  }
                : undefined,
            channel,
        };
    } else {
        return {
            publicationId: result.id,
            type: result.__typename,
            source: Source.Lens,
            postId: result.id,
            slug: result.slug,
            timestamp,
            author: profile,
            mediaObjects,
            isHidden: result.isDeleted,
            isEncrypted: false,
            metadata: {
                locale,
                content: {
                    ...content,
                    oembedUrl,
                },
                contentURI: result.contentUri,
            },
            stats: formatLensPostStats(result.stats),
            ...formatLensPostOperations(result.operations, result.actions),
            collectModule: formatCollectModuleV3(result.actions, result.stats.collects),
            mentions: mentions.profiles,
            groups: mentions.groups,
            __original__: result,
            momoka: undefined,
            sendFrom: result.app?.metadata?.name
                ? {
                      displayName: result.app.metadata.name,
                      name: result.app.metadata.name,
                  }
                : undefined,
            channel,
        };
    }
}

export function formatLensPostByFeedV3(result: TimelineItem): Post | null {
    const firstComment = result.comments.length ? first(result.comments) : undefined;
    const basePost = result.primary;
    if (isMutedLensAccount(basePost.author)) return null;
    const post = formatLensPostV3(basePost);
    const mirrors = result.reposts.map((x) => formatLensProfileV3(x.author));
    const reactions: Profile[] = []; // TODO
    const comments = filterFeedsV3(result.comments).map((x) => formatLensPostV3(x));

    return {
        ...post,
        comments,
        mirrors,
        reactions,
        commentOn: basePost.commentOn ? formatLensPostV3(basePost.commentOn) : undefined,
        root:
            firstComment && result.primary.commentOn
                ? formatLensPostV3(result.primary.commentOn as AnyPost)
                : undefined,
    };
}
