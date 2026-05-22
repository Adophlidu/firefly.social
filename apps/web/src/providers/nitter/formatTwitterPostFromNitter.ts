import { AttachmentType, PostType, Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import dayjs from 'dayjs';
import { compact, first, last } from 'lodash-es';
import type { ApiV2Includes, TweetV2 } from 'twitter-api-v2';
import urlcat from 'urlcat';

import { POLL_CHOICE_TYPE, POLL_STRATEGIES } from '@/constants/poll.js';
import { URL_REGEX } from '@/constants/regexp.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { parsePostUrl } from '@/helpers/parsePostUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { parseHtml } from '@/libs/parseHtml.js';
import { formatTwitterProfileFromNitter } from '@/providers/nitter/formatTwitterProfileFromNitter.js';
import { getTwitterNitterPicOrigUrl, getTwitterNitterPicUrl } from '@/providers/nitter/getTwitterNitterPicUrl.js';
import { resolveTweetReplySettings } from '@/providers/twitter/formatTwitterPost.js';
import { formatTwitterProfile, formatTwitterProfileStatus } from '@/providers/twitter/formatTwitterProfile.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Tweet } from '@/providers/types/Nitter.js';
import type { Attachment, Post } from '@/providers/types/SocialMedia.js';

function parseTweetText(text: string) {
    const document = parseHtml(`<div>${text}</div>`);
    const anchorElements = document.querySelectorAll('a');
    for (const anchorElement of anchorElements) {
        if (anchorElement.innerText.startsWith('#')) continue;
        if (anchorElement.innerText.startsWith('$')) continue;
        if (anchorElement.innerText.startsWith('@')) continue;
        if (anchorElement.innerText.startsWith('＃')) {
            anchorElement.innerHTML = `#${anchorElement.innerHTML.slice(1)}`;
            continue;
        }
        const parsedPostUrl = parsePostUrl(anchorElement.href);
        if (parsedPostUrl) {
            anchorElement.innerHTML = urlcat(SITE_URL, resolvePostUrl(parsedPostUrl.source, parsedPostUrl.id));
            continue;
        }
        const parsedProfileUrl = parsePostUrl(anchorElement.href);
        if (parsedProfileUrl) {
            anchorElement.innerHTML = urlcat(
                SITE_URL,
                getProfileUrl({
                    source: parsedProfileUrl.source,
                    profileId: parsedProfileUrl.id,
                    handle: parsedProfileUrl.id,
                }),
            );
            continue;
        }
        anchorElement.innerHTML = anchorElement.href;
    }

    // `document.body.textContent` or `document.textContent` is not working
    return document.children[0].textContent;
}

function parseTweetMentions(text: string): Post['mentions'] {
    const document = parseHtml(`<div>${text}</div>`);
    const anchorElements = document.querySelectorAll('a');
    return compact(
        [...anchorElements].map((el) => {
            if (el.innerText.startsWith('@')) {
                const handle = el.innerText.slice(1);
                return { handle, fullHandle: handle, profileId: handle, source: Source.Twitter };
            }
            return null;
        }),
    );
}

function parseTweetOembedUrls(text: string) {
    const document = parseHtml(`<div>${text}</div>`);
    const anchorElements = document.querySelectorAll('a');
    return compact(
        [...anchorElements].map((el) => {
            URL_REGEX.lastIndex = 0;
            if (el.href && URL_REGEX.test(el.href)) return el.href;
            return null;
        }),
    );
}

function extractDimensionsFromUrl(url: string): { width: number; height: number } | null {
    const match = url.match(/\/(\d+)x(\d+)(?=\/|$)/);
    if (match) {
        const width = Number.parseInt(match[1], 10);
        const height = Number.parseInt(match[2], 10);
        return { width, height };
    }
    return null;
}

export function formatTwitterPostFromNitter(
    tweet: Tweet,
    options?: {
        base?: Partial<Post>;
        tweet?: TweetV2;
        includes?: ApiV2Includes;
    },
): Post {
    const includesUser = options?.includes?.users?.find((u) => u.id === tweet.user.id);
    const attachments = (tweet.media ?? []).flatMap<Attachment>((m) => {
        switch (m.type) {
            case 'photo':
                if (!m.url.trim()) return [];
                return [{ type: AttachmentType.Image, uri: getTwitterNitterPicOrigUrl(m.url) }];
            case 'gif':
                return [
                    {
                        type: AttachmentType.AnimatedGif,
                        uri: getTwitterNitterPicUrl(m.url),
                        coverUri: getTwitterNitterPicUrl(m.thumb),
                    },
                ];
            case 'video': {
                const uri = last(m.variants)?.url;
                if (!uri) return [];
                return [
                    {
                        type: AttachmentType.Video,
                        uri,
                        coverUri: getTwitterNitterPicUrl(m.thumb),
                        ...extractDimensionsFromUrl(uri),
                    },
                ];
            }
        }
    });

    const content = parseTweetText(tweet.text) ?? '';
    const oembedUrls = parseTweetOembedUrls(tweet.text);

    const post: Post = {
        ...options?.base,
        publicationId: tweet.id,
        postId: tweet.id,
        type: PostType.Post,
        source: Source.Twitter,
        restrictions: resolveTweetReplySettings(options?.tweet?.reply_settings),
        author: includesUser ? formatTwitterProfile(includesUser) : formatTwitterProfileFromNitter(tweet.user),
        stats: {
            reactions: tweet.stats.likes,
            comments: tweet.stats.replies,
            mirrors: tweet.stats.retweets,
            quotes: tweet.stats.quotes,
        },
        timestamp: dayjs.unix(tweet.time).valueOf(),
        mentions: parseTweetMentions(tweet.text),
        metadata: {
            locale: 'en',
            content: {
                content,
                attachments,
                asset: first(attachments),
                oembedUrls,
                oembedUrl: last(oembedUrls),
            },
        },
        __original__: tweet,
    };

    if (tweet.threadId && tweet.threadId !== '0') {
        post.rootPostId = tweet.threadId;
    }

    if (tweet.replyId !== '0') {
        post.parentPostId = tweet.replyId;
        post.type = PostType.Comment;
    }

    if (tweet.quote && tweet.quote.id !== '0') {
        post.quoteOn = formatTwitterPostFromNitter(tweet.quote);
        post.type = PostType.Quote;
    }

    if (tweet.retweet) {
        post.type = PostType.Mirror;
        post.reporter = post.author;
        post.author = formatTwitterProfileFromNitter(tweet.retweet.user);
        post.mirrorOn = formatTwitterPostFromNitter(tweet.retweet);
        // For retweets, show the original tweet's publish time (not the retweet time).
        if (typeof post.mirrorOn?.timestamp === 'number') {
            post.timestamp = post.mirrorOn.timestamp;
        }
        post.quoteOn = post.mirrorOn.quoteOn;
        post.metadata = post.mirrorOn.metadata;
        post.stats = post.mirrorOn.stats;
        post.parentPostId = post.mirrorOn.postId;
        const author = options?.includes?.users?.find((user) => user.id === post.author.profileId);
        post.author.viewerContext = formatTwitterProfileStatus(author?.connection_status);
        const mentions = parseTweetMentions(tweet.retweet.text);
        if (mentions?.length) post.mentions = post.mentions ? [...post.mentions, ...mentions] : mentions;
        const retweeted = options?.tweet?.referenced_tweets?.find((tweet) => tweet.type === 'retweeted');
        if (retweeted && options?.tweet?.author_id === twitterSessionHolder.session?.profileId) post.hasMirrored = true;
    }

    if (tweet.poll) {
        const poll = tweet.poll;
        const cardPrefix = 'card://';
        const id = poll.url.startsWith(cardPrefix) ? poll.url.substring(cardPrefix.length) : poll.url;
        const durationMinutes = poll.durationMinutes ? Number.parseInt(poll.durationMinutes, 10) : 0;
        // Filter out empty poll options to handle nitter API returning fixed-size arrays
        const validOptions = poll.options.filter((x) => x.trim());
        const validValues = poll.values.filter((_, i) => poll.options[i].trim());
        post.poll = {
            id,
            options: validOptions.map((x, i) => ({ label: x, id: x, votes: validValues[i] ?? 0 })),
            durationSeconds: durationMinutes * 60,
            votingStatus: dayjs(poll.endTime).isBefore(dayjs()) ? 'open' : 'closed',
            endDatetime: poll.endTime,
            source: Source.Twitter,
            type: POLL_CHOICE_TYPE.Single,
            strategies: POLL_STRATEGIES.None,
        };
    }

    return post;
}
