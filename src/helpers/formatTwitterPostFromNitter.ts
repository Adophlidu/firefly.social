import dayjs from 'dayjs';
import { parseHTML } from 'linkedom';
import { compact, first, last } from 'lodash-es';
import urlcat from 'urlcat';

import { RestrictionType, Source } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { formatTwitterProfileFromNitter } from '@/helpers/formatTwitterProfileFromNitter.js';
import { getTwitterNitterPicOrigUrl, getTwitterNitterPicUrl } from '@/helpers/getTwitterNitterPicUrl.js';
import { parsePostUrl } from '@/helpers/parsePostUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import type { Tweet } from '@/providers/types/Nitter.js';
import type { Attachment, Post } from '@/providers/types/SocialMedia.js';

function parseTweetText(text: string) {
    const { document } = parseHTML(`<div>${text}</div>`);
    const anchorElements = document.querySelectorAll('a');
    for (const anchorElement of anchorElements) {
        if (anchorElement.innerText.startsWith('#')) continue;
        if (anchorElement.innerText.startsWith('$')) continue;
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

export function formatTwitterPostFromNitter(
    tweet: Tweet,
    options?: {
        base?: Partial<Post>;
    },
): Post {
    const attachments = [
        ...(tweet.photos?.map<Attachment>((photo) => ({
            type: 'Image',
            uri: getTwitterNitterPicOrigUrl(photo),
        })) ?? []),
        ...compact([tweet.gif]).map<Attachment>(({ url, thumb }) => ({
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

    const post: Post = {
        ...options?.base,
        publicationId: tweet.id,
        postId: tweet.id,
        type: 'Post',
        source: Source.Twitter,
        restrictions: [RestrictionType.Everyone], // TODO
        author: formatTwitterProfileFromNitter(tweet.user),
        stats: {
            reactions: tweet.stats.likes,
            comments: tweet.stats.replies,
            mirrors: tweet.stats.retweets,
            quotes: tweet.stats.quotes,
        },
        timestamp: dayjs.unix(tweet.time).valueOf(),
        mentions: [], // TODO
        metadata: {
            locale: 'en',
            content: {
                content: parseTweetText(tweet.text) ?? '',
                attachments,
                asset: first(attachments),
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
        post.metadata = post.mirrorOn.metadata;
        post.stats = post.mirrorOn.stats;
        post.parentPostId = post.mirrorOn.postId;
    }

    return post;
}
