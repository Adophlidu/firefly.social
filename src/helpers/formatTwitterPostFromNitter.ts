import dayjs from 'dayjs';
import { parseHTML } from 'linkedom';
import { compact, first, last } from 'lodash-es';
import type { ApiV2Includes, TweetV2 } from 'twitter-api-v2';
import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { URL_REGEX } from '@/constants/regexp.js';
import { resolveTweetReplySettings } from '@/helpers/formatTwitterPost.js';
import { formatTwitterProfileFromNitter } from '@/helpers/formatTwitterProfileFromNitter.js';
import { getTwitterNitterPicOrigUrl, getTwitterNitterPicUrl } from '@/helpers/getTwitterNitterPicUrl.js';
import { parsePostUrl } from '@/helpers/parsePostUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Tweet } from '@/providers/types/Nitter.js';
import type { Attachment, Post } from '@/providers/types/SocialMedia.js';

function parseTweetText(text: string) {
    const { document } = parseHTML(`<div>${text}</div>`);
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
            anchorElement.innerHTML = urlcat(SITE_URL, resolveProfileUrl(parsedProfileUrl.source, parsedProfileUrl.id));
            continue;
        }
        anchorElement.innerHTML = anchorElement.href;
    }
    // `document.body.textContent` or `document.textContent` is not working
    return document.children[0].textContent;
}

function parseTweetMentions(text: string): Post['mentions'] {
    const { document } = parseHTML(`<div>${text}</div>`);
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
    const { document } = parseHTML(`<div>${text}</div>`);
    const anchorElements = document.querySelectorAll('a');
    return compact(
        [...anchorElements].map((el) => {
            if (el.href && URL_REGEX.test(el.href)) return el.href;
            return null;
        }),
    );
}

export function formatTwitterPostFromNitter(
    tweet: Tweet,
    options?: {
        base?: Partial<Post>;
        tweet?: TweetV2;
        includes?: ApiV2Includes;
    },
): Post {
    const attachments = [
        ...(tweet.photos?.map<Attachment>((photo) => ({
            type: 'Image',
            uri: getTwitterNitterPicOrigUrl(photo),
        })) ?? []),
        ...compact(tweet.gifs).map<Attachment>(({ url, thumb }) => ({
            type: 'AnimatedGif',
            uri: getTwitterNitterPicUrl(url),
            coverUri: getTwitterNitterPicUrl(thumb),
        })),
        ...compact([tweet.video])
            .map<Attachment>(({ variants, thumb }) => ({
                type: 'Video',
                uri: last(variants)?.url!,
                coverUri: getTwitterNitterPicUrl(thumb),
            }))
            .filter((x) => x.uri),
    ];

    const content = parseTweetText(tweet.text) ?? '';
    const oembedUrls = parseTweetOembedUrls(tweet.text);

    const post: Post = {
        ...options?.base,
        publicationId: tweet.id,
        postId: tweet.id,
        type: 'Post',
        source: Source.Twitter,
        restrictions: resolveTweetReplySettings(options?.tweet?.reply_settings),
        author: formatTwitterProfileFromNitter(tweet.user),
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

    if (tweet.reply.length && tweet.replyId !== '0') {
        post.parentPostId = tweet.replyId;
        post.type = 'Comment';
    }

    if (tweet.quote && tweet.quote.id !== '0') {
        post.quoteOn = formatTwitterPostFromNitter(tweet.quote);
        post.type = 'Quote';
    }

    if (tweet.retweet) {
        post.type = 'Mirror';
        post.reporter = post.author;
        post.author = formatTwitterProfileFromNitter(tweet.retweet.user);
        post.mirrorOn = formatTwitterPostFromNitter(tweet.retweet);
        post.quoteOn = post.mirrorOn.quoteOn;
        post.metadata = post.mirrorOn.metadata;
        post.stats = post.mirrorOn.stats;
        post.parentPostId = post.mirrorOn.postId;
        const retweeted = options?.tweet?.referenced_tweets?.find((tweet) => tweet.type === 'retweeted');
        if (retweeted && options?.tweet?.author_id === twitterSessionHolder.session?.profileId) post.hasMirrored = true;
    }

    return post;
}
