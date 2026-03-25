import { envs } from '@dimensiondev/envs';
import { compact, last } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { TRUMP_TWITTER_PROFILE } from '@/constants/mentions.js';
import { MENTION_REGEX, URL_REGEX } from '@/constants/regexp.js';
import { getEmbedUrls } from '@/helpers/getEmbedUrls.js';
import { type TruthSocialPost } from '@/providers/types/Firefly.js';
import { type Attachment, type Post, type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

function formatAuthor(account: TruthSocialPost['account']): Profile {
    const pfp =
        account.avatar && account.avatar === envs.external.NEXT_PUBLIC_TRUTH_SOCIAL_AVATAR_ORIGINAL
            ? envs.external.NEXT_PUBLIC_TRUTH_SOCIAL_AVATAR_PROXY || account.avatar
            : account.avatar;

    return {
        source: Source.Twitter,
        pfp,
        handle: TRUMP_TWITTER_PROFILE.handle,
        displayName: account.display_name,
        profileId: TRUMP_TWITTER_PROFILE.platform_id,
        profileSource: Source.Twitter,
        fullHandle: account.handle,
        followerCount: 0,
        followingCount: 0,
        verified: true,
        status: ProfileStatus.Active,
    };
}

function resolveMediaType(media: TruthSocialPost['media_attachments'][number]) {
    if (media.type === 'image') return 'Image';
    if (media.type === 'video') return 'Video';
    return undefined;
}

function formatContent(data: TruthSocialPost): Post['metadata']['content'] {
    const embedUrls = data.media_attachments || [];

    const oembedUrls = getEmbedUrls(data.content, compact(embedUrls.map((x) => x.url)));

    const defaultContent = { content: data.content, oembedUrl: last(oembedUrls), oembedUrls };

    const attachments = embedUrls.filter((x) => {
        if (!x.url || !resolveMediaType(x)) return false;

        return true;
    });

    if (attachments.length) {
        const lastAsset = last(attachments);
        if (!lastAsset?.url) return defaultContent;

        const assetType = resolveMediaType(lastAsset);
        if (!assetType) return defaultContent;

        return {
            content: data.content.replace(lastAsset.url, ''),
            oembedUrl: last(oembedUrls),
            oembedUrls,
            asset: {
                type: assetType,
                uri: lastAsset.url,
                coverUri: lastAsset.preview_url || undefined,
            } satisfies Attachment,
            attachments: compact<Attachment>(
                attachments.map((x) => {
                    if (!x.url) return;

                    const type = resolveMediaType(x);
                    if (!type) return;

                    return {
                        type,
                        uri: x.url,
                        coverUri: x.preview_url || undefined,
                    };
                }),
            ),
        };
    }
    return defaultContent;
}

function formatInlineQuotes(content: string) {
    const inlineQuoteRegex = new RegExp(`\\bRT:\\s*${URL_REGEX.source}(?=\\s|$|,|\\.|\\\\)`, 'gi');
    const quoteMatches = content.match(inlineQuoteRegex);

    const inlineMentionRegex = new RegExp(`\\bRT\\s*${MENTION_REGEX.source}`, 'gi');
    const mentionMatches = content.match(inlineMentionRegex);

    const formattedContent = content.replace(inlineQuoteRegex, '').replace(inlineMentionRegex, (match, p1) => {
        const mention = match.replace(/^RT\s*/, '').trim();
        return mention;
    });

    return {
        content: formattedContent,
        inlineQuotes:
            quoteMatches?.map((x) => x.replace(/^RT:\s*/, '').trim()).filter((x) => x.startsWith('https://')) || [],
        inlineMentions: mentionMatches?.map((x) => x.replace(/^RT\s*@/, '').trim()).filter(Boolean) || [],
    };
}

export function formatPostsFromTruthSocial(data: TruthSocialPost): Post {
    const { content, inlineMentions } = formatInlineQuotes(data.content);

    return {
        isTruthSocial: true,
        retruthed: data.has_reblog,
        source: Source.Twitter,
        publicationId: data.truth_id,
        postId: data.truth_id,
        type: 'Post',
        timestamp: new Date(data.post_time).getTime(),
        author: formatAuthor(data.account),
        permalink: data.url,
        mentions: inlineMentions.map((x) => ({
            handle: x,
            source: Source.Twitter,
            profileId: x,
            fullHandle: x,
        })),
        metadata: {
            locale: 'en',
            content: {
                ...formatContent(data),
                content,
            },
        },
        __original__: data,
    };
}
