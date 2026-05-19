import { PostType, Source } from '@dimensiondev/enums';
import { isSameUrl, parseUrl } from '@dimensiondev/utils';
import { compact, last, uniqWith } from 'lodash-es';

import { FIREFLY_S3_URL } from '@/constants/static.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getEmbedUrls } from '@/helpers/getEmbedUrls.js';
import { isIpfsCID } from '@/helpers/isIpfsCID.js';
import { isTopLevelDomain } from '@/helpers/isTopLevelDomain.js';
import { resolveEmbedMediaType } from '@/helpers/resolveEmbedMediaType.js';
import { resolveSizeFromS3Url } from '@/helpers/resolveSizeFromS3Url.js';
import { formatChannelFromFirefly } from '@/providers/farcaster/formatFarcasterChannelFromFirefly.js';
import { formatFarcasterProfileFromFirefly } from '@/providers/farcaster/formatFarcasterProfileFromFirefly.js';
import { type Cast, EmbedMediaType } from '@/providers/types/Firefly.js';
import type { Attachment, Post, Profile } from '@/providers/types/SocialMedia.js';

function getCoverUriFromUrl(url: string) {
    const parsed = parseUrl(url);
    if (!parsed) return '';

    if (parsed.origin === FIREFLY_S3_URL && url.endsWith('.m3u8')) {
        return url.replace(/[^/]+\.m3u8$/, 'thumbnail.jpg');
    }

    return '';
}

function formatContent(cast: Cast): Post['metadata']['content'] {
    const embedUrls: Array<{ url: string; type?: EmbedMediaType }> = cast.embed_urls?.length
        ? cast.embed_urls
        : cast.embeds;

    const attachments = embedUrls.filter((x) => {
        if (!x.url) return false;
        const type = resolveEmbedMediaType(x.url, x.type);
        if (!type) return false;
        return true;
    });

    const embedUrlList = compact(
        embedUrls
            .filter((x) => (x.type ? [EmbedMediaType.TEXT, EmbedMediaType.FRAME].includes(x.type) : true))
            .map((x) => x.url),
    );

    const allUrls = getEmbedUrls(cast.text, embedUrlList);
    const content_source = allUrls.length <= 1 ? cast.text : '';

    const oembedUrls = uniqWith(
        getEmbedUrls(content_source, embedUrlList).filter(
            (x) => isTopLevelDomain(x) && !attachments.some((a) => a.url === x),
        ),
        (a, b) => isSameUrl(a, b),
    );

    const defaultContent = { content: cast.text, oembedUrl: last(oembedUrls), oembedUrls };

    if (attachments.length) {
        const lastAsset = last(attachments);
        if (!lastAsset?.url) return defaultContent;
        const assetType = resolveEmbedMediaType(lastAsset.url, lastAsset.type);
        if (!assetType) return defaultContent;
        return {
            content: cast.text.replace(lastAsset.url, ''),
            oembedUrl: last(oembedUrls),
            oembedUrls,
            asset: {
                type: assetType,
                uri: lastAsset.url,
                coverUri: getCoverUriFromUrl(lastAsset.url),
                ...resolveSizeFromS3Url(lastAsset.url),
            } satisfies Attachment,
            attachments: compact<Attachment>(
                attachments.map((x) => {
                    if (!x.url) return;

                    const type = resolveEmbedMediaType(x.url, x.type);
                    if (!type) return;

                    return {
                        type,
                        uri: x.url,
                        coverUri: getCoverUriFromUrl(x.url),
                        ...resolveSizeFromS3Url(x.url),
                    };
                }),
            ),
        };
    }
    return defaultContent;
}

function getPostTypeByCast(cast: Cast) {
    if (cast.quotedCast) return PostType.Quote;
    if (cast.recastedBy) return PostType.Mirror;
    if (cast.parentCast) return PostType.Comment;
    return PostType.Post;
}

/**
 * Return null if cast is detected
 */
export function formatFarcasterPostFromFirefly(cast: Cast, type?: PostType): Post {
    const postType = type ?? getPostTypeByCast(cast);
    const content = formatContent(cast);
    const incomplete =
        cast.sendFrom?.display_name === 'tako-protocol' &&
        !!content?.content?.endsWith('...') &&
        isIpfsCID(cast.embeds[0]?.url);
    return {
        publicationId: cast.hash,
        type: postType,
        postId: cast.hash,
        parentPostId: cast.parent_hash,
        parentAuthor: cast.parentCast?.author ? formatFarcasterProfileFromFirefly(cast.parentCast?.author) : undefined,
        timestamp: cast.timestamp ? new Date(cast.timestamp).getTime() : undefined,
        author: cast.author ? formatFarcasterProfileFromFirefly(cast.author) : createDummyProfile(Source.Farcaster),
        isHidden: !!cast.deleted_at,
        metadata: {
            locale: '',
            content,
        },
        stats: {
            comments: Number(cast.replyCount),
            mirrors: cast.recastCount,
            quotes: cast.quotedCount,
            reactions: cast.likeCount,
        },
        mentions: cast.mentions_user.map<Profile>((x) => {
            return {
                ...createDummyProfile(Source.Farcaster),
                profileId: x.fid,
                displayName: x.handle,
                handle: x.handle,
                fullHandle: x.handle,
            };
        }),
        mirrors: cast.recastedBy ? [formatFarcasterProfileFromFirefly(cast.recastedBy)] : undefined,
        hasLiked: cast.liked,
        hasMirrored: cast.recasted,
        hasBookmarked: cast.bookmarked,
        source: Source.Farcaster,
        canComment: true,
        commentOn: cast.parentCast ? formatFarcasterPostFromFirefly(cast.parentCast) : undefined,
        root: cast.rootParentCast ? formatFarcasterPostFromFirefly(cast.rootParentCast) : undefined,
        threads: compact(cast.threads?.map((x) => formatFarcasterPostFromFirefly(x, PostType.Comment))),
        channel: cast.channel ? formatChannelFromFirefly(cast.channel) : undefined,
        quoteOn: cast.quotedCast ? formatFarcasterPostFromFirefly(cast.quotedCast) : undefined,
        sendFrom: {
            displayName: cast.sendFrom?.display_name ?? cast.sendFrom?.name,
            name: cast.sendFrom?.name,
            id: cast.sendFrom?.fid?.toString(),
        },
        incomplete,
        partialContent: incomplete ? content?.content : undefined,
        fullContent: incomplete ? undefined : content?.content,
        __original__: cast,
    };
}
