import { EMPTY_LIST } from '@dimensiondev/constants';
import { PostType, RestrictionType, Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { safeUnreachable } from '@dimensiondev/utils';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@dimensiondev/utils';
import { compact, find, first, last } from 'lodash-es';
import type { ApiV2Includes, TweetV2, TweetV2PaginableTimelineResult } from 'twitter-api-v2';
import urlcat from 'urlcat';

import { POLL_CHOICE_TYPE, POLL_STRATEGIES } from '@/constants/poll.js';
import { TWEET_REGEX } from '@/constants/regexp.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getEmbedUrls } from '@/helpers/getEmbedUrls.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import { formatTwitterMedia } from '@/providers/twitter/formatTwitterMedia.js';
import { convertTwitterAvatar, formatTwitterProfileStatus } from '@/providers/twitter/formatTwitterProfile.js';
import { resolveTwitterRetweetStatus } from '@/providers/twitter/resolveTwitterRetweetStatus.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function resolveTweetReplySettings(replySettings?: TweetV2['reply_settings']): RestrictionType[] {
    if (!replySettings) return [RestrictionType.Everyone];

    switch (replySettings) {
        case 'everyone':
            return [RestrictionType.Everyone];
        case 'following':
            return [RestrictionType.OnlyPeopleYouFollow];
        case 'mentionedUsers':
            return [RestrictionType.MentionedProfiles];
        default:
            safeUnreachable(replySettings);
            return [RestrictionType.Everyone];
    }
}

export function tweetV2ToPost(item: TweetV2, includes?: ApiV2Includes): Post {
    const user = includes?.users?.find((u) => u.id === item.author_id);
    const repliedTweetId = item.referenced_tweets?.find((tweet) => tweet.type === 'replied_to')?.id;
    const repliedTweet = repliedTweetId ? includes?.tweets?.find((tweet) => tweet.id === repliedTweetId) : undefined;
    const quotedTweetId = item.referenced_tweets?.find((tweet) => tweet.type === 'quoted')?.id;
    const quotedTweet = quotedTweetId ? includes?.tweets?.find((tweet) => tweet.id === quotedTweetId) : undefined;
    const retweeted = item.referenced_tweets?.find((tweet) => tweet.type === 'retweeted');
    const retweetedTweet = retweeted ? includes?.tweets?.find((tweet) => tweet.id === retweeted.id) : undefined;
    const attachments = compact(
        item.attachments?.media_keys?.map((key) => {
            const media = includes?.media?.find((m) => m.media_key === key);
            return media ? formatTwitterMedia(media) : null;
        }),
    );
    let entitiesUrls = item.note_tweet?.entities?.urls ?? item.entities?.urls;
    let content = item.note_tweet?.text || item.text || '';
    const mentions = item?.note_tweet?.entities?.mentions ?? item?.entities?.mentions;
    const ret: Post = {
        publicationId: item.id,
        postId: item.id,
        type: PostType.Post,
        source: Source.Twitter,
        hasMirrored: item.retweeted || undefined,
        restrictions: resolveTweetReplySettings(item.reply_settings),
        author: {
            ...createDummyProfile(Source.Twitter),
            profileId: item.author_id!,
            displayName: user?.name ?? '',
            handle: user?.username!,
            fullHandle: user?.username!,
            pfp: convertTwitterAvatar(user?.profile_image_url!),
            verified: user?.verified ?? false,
            viewerContext: formatTwitterProfileStatus(user?.connection_status),
        },
        stats: {
            reactions: item.public_metrics?.like_count ?? 0,
            comments: item.public_metrics?.reply_count ?? 0,
            mirrors: item.public_metrics?.retweet_count ?? 0,
            quotes: item.public_metrics?.quote_count ?? 0,
            views: item.public_metrics?.impression_count,
        },
        timestamp: item?.created_at ? new Date(item.created_at).getTime() : Date.now(),
        mentions: mentions?.map((mention) => {
            return {
                ...createDummyProfile(Source.Twitter),
                profileId: mention.id,
                displayName: mention.username,
                handle: mention.username,
                fullHandle: mention.username,
            };
        }),
        metadata: {
            locale: item.lang!,
            content: {
                content,
                asset: attachments?.[0],
                attachments,
            },
            // @ts-expect-error twitter-api-v2 doesn't have `tweet.article` yet
            article: item.article
                ? {
                      cover: urlcat(SITE_URL, '/api/twitter/article/:id/image', {
                          id: item.id,
                      }),
                      // @ts-expect-error twitter-api-v2 doesn't have `tweet.article` yet
                      title: item.article.title,
                  }
                : undefined,
        },
        sendFrom: item.sendFrom,
        __original__: item,
    };
    if (repliedTweet) {
        ret.type = PostType.Comment;
        ret.commentOn = tweetV2ToPost(repliedTweet, includes);
        content = content.replace(/^(@\w+\s*)+/, '');
        let endCommentOn = ret.commentOn;
        while (endCommentOn?.commentOn) {
            endCommentOn = endCommentOn?.commentOn;
        }

        const hasReplied = repliedTweet?.referenced_tweets?.find((tweet) => tweet.type === 'replied_to');
        if (!hasReplied) {
            ret.root = tweetV2ToPost(repliedTweet, includes);
            ret.rootPostId = ret.root.postId;
        } else if (endCommentOn) {
            ret.root = endCommentOn;
            ret.rootPostId = endCommentOn.postId;
        }
        if (isSamePost(ret.root, ret.commentOn)) {
            delete ret.root;
        }
        if (ret.root) {
            ret.isThread = true;
        }
    }
    if (retweeted) {
        ret.type = PostType.Mirror;
        if (resolveTwitterRetweetStatus(item, twitterSessionHolder.session?.profileId, retweetedTweet)) {
            ret.hasMirrored = true;
        }
        if (retweetedTweet) {
            ret.mirrorOn = tweetV2ToPost(retweetedTweet, includes);
            ret.postId = retweetedTweet.id;
            // For retweets, show the original tweet's publish time (not the retweet time).
            if (retweetedTweet.created_at) {
                ret.timestamp = new Date(retweetedTweet.created_at).getTime();
            } else if (ret.mirrorOn?.timestamp) {
                ret.timestamp = ret.mirrorOn.timestamp;
            }
            // @ts-expect-error twitter-api-v2 doesn't have `tweet.article` yet
            ret.metadata.article = retweetedTweet.article
                ? {
                      cover: urlcat(SITE_URL, '/api/twitter/article/:id/image', {
                          id: retweetedTweet.id,
                      }),
                      // @ts-expect-error twitter-api-v2 doesn't have `tweet.article` yet
                      title: retweetedTweet.article.title,
                  }
                : undefined;
            content = retweetedTweet.note_tweet?.text || retweetedTweet.text;
            const entities = [
                ...(retweetedTweet.note_tweet?.entities?.urls ?? []),
                ...(retweetedTweet?.entities?.urls ?? []),
            ];
            if (entities.length) entitiesUrls = entities;
            // Update mentions from retweeted tweet for proper highlighting
            const retweetedMentions =
                retweetedTweet?.note_tweet?.entities?.mentions ?? retweetedTweet?.entities?.mentions;
            if (retweetedMentions) {
                ret.mentions = retweetedMentions.map((mention) => {
                    return {
                        ...createDummyProfile(Source.Twitter),
                        profileId: mention.id,
                        displayName: mention.username,
                        handle: mention.username,
                        fullHandle: mention.username,
                    };
                });
            }
        }
        const mention = mentions?.sort((a, b) => a.start - b.start)?.[0];
        if (mention) {
            if (content?.startsWith('RT @')) {
                let newContent = content.substring(mention.end);
                if (newContent.startsWith(': ')) newContent = newContent.substring(2);
                ret.metadata.content!.content = newContent;
            }
            const author = includes?.users?.find((user) => user.id === mention.id);
            ret.reporter = ret.author;
            ret.parentPostId = retweeted.id;
            ret.author = {
                ...createDummyProfile(Source.Twitter),
                profileId: mention.id,
                displayName: author?.name ?? mention?.username ?? '',
                handle: mention?.username!,
                fullHandle: mention?.username!,
                pfp: convertTwitterAvatar(author?.profile_image_url ?? ''),
                verified: false,
                viewerContext: formatTwitterProfileStatus(author?.connection_status),
            };
        }
        if (ret.metadata.content) {
            ret.metadata.content.content = content;
            if (ret.mirrorOn?.metadata.content?.attachments)
                ret.metadata.content.attachments = ret.mirrorOn.metadata.content.attachments;
        }
    }
    if (item.attachments?.poll_ids?.length) {
        const poll = find(includes?.polls ?? [], (poll) => poll.id === first(item.attachments?.poll_ids));

        if (poll) {
            ret.poll = {
                id: poll.id,
                options: poll.options.map((x) => ({ ...x, id: x.label })),
                durationSeconds: poll.duration_minutes ? poll.duration_minutes * 60 : 0,
                votingStatus: poll.voting_status,
                endDatetime: poll.end_datetime,
                source: Source.Twitter,
                type: POLL_CHOICE_TYPE.Single,
                strategies: POLL_STRATEGIES.None,
            };
        }
    }

    entitiesUrls?.forEach((url) => {
        content = content.replaceAll(url.url, url.media_key ? '' : url.expanded_url);
    });
    let oembedUrls = getEmbedUrls(content, []);

    if (quotedTweet) {
        ret.quoteOn = tweetV2ToPost(quotedTweet, includes);
        ret.type = PostType.Quote;
        // remove quote tweet url from content
        const quoteUrls = oembedUrls.filter((url) => url.match(TWEET_REGEX)?.[3] === ret.quoteOn?.postId);
        quoteUrls.forEach((url) => {
            content = content.replaceAll(url, '');
            oembedUrls = oembedUrls.filter((x) => x !== url);
        });
    }

    // For Mirror (retweet), copy quoteOn from mirrorOn if it exists
    if (ret.type === PostType.Mirror && ret.mirrorOn?.quoteOn && !ret.quoteOn) {
        ret.quoteOn = ret.mirrorOn.quoteOn;
    }

    ret.metadata.content = {
        ...ret.metadata.content,
        oembedUrls,
        oembedUrl: last(oembedUrls),
        content,
    };

    return ret;
}

export function formatTweetsPage(
    data: TweetV2PaginableTimelineResult,
    currentIndicator?: PageIndicator,
): Pageable<Post, PageIndicator> {
    const posts = data.data?.map((item) => tweetV2ToPost(item, data.includes)) || EMPTY_LIST;
    return createPageable(
        posts,
        createIndicator(currentIndicator),
        data.meta?.next_token ? createIndicator(undefined, data.meta.next_token) : undefined,
    );
}
