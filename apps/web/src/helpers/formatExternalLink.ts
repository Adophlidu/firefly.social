import { safeUnreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { ExternalSiteDomain, type SocialSource, Source } from '@/constants/enum.js';
import { FARCASTER_DETAIL_REGEX, TWEET_REGEX } from '@/constants/regexp.js';
import { SITE_URL } from '@/constants/static.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getSiteTypeFromUrl } from '@/helpers/getSiteTypeFromUrl.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { trimify } from '@/helpers/trimify.js';
import { getBskyProfileByHandle } from '@/providers/bsky/getBskyProfileByHandle.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { getPostById } from '@/providers/firefly/farcaster-hub/getPostById.js';
import { getPostByShortId } from '@/providers/firefly/farcaster-hub/getPostByShortId.js';

async function captureProfileUrl(url: URL, regex: RegExp, source: SocialSource) {
    const matched = regex.exec(url.pathname);
    const handle = trimify(matched?.[1] ?? '');
    if (handle) return urlcat(SITE_URL, getProfileUrl({ source, handle }));
    return;
}

async function captureChannelUrl(url: URL, regex: RegExp, source: SocialSource) {
    const { pathname } = url;
    const matched = regex.exec(pathname);
    if (source === Source.Bsky) {
        const author = trimify(matched?.[1] ?? '');
        const feedName = trimify(matched?.[2] ?? '');
        const profile = await getBskyProfileByHandle(author);
        if (!profile) return;
        const channelDid = `${profile.profileId.replace('did:plc:', '')}_${feedName}`;
        return urlcat(SITE_URL, resolveChannelUrl(channelDid, source));
    }

    const handle = trimify(matched?.[1] ?? '');
    if (handle) {
        return urlcat(SITE_URL, resolveChannelUrl(handle, source));
    }

    return;
}

async function capturePostUrl(url: URL, regex: RegExp, source: SocialSource) {
    const { pathname } = url;
    const matched = regex.exec(pathname);
    const postId = trimify(matched?.[1] ?? '');
    if (source === Source.Farcaster) {
        const handle = trimify(matched?.[1] ?? '');
        const postId = trimify(matched?.[2] ?? '');
        if (!handle || !postId) return;
        const post =
            postId.length > 10
                ? await getPostById(postId)
                : await getPostByShortId(postId, handle, farcasterSessionHolder.session?.profileId);
        if (!post) return;
        return urlcat(SITE_URL, resolvePostUrl(source, post.postId));
    } else if (source === Source.Bsky) {
        const author = trimify(matched?.[1] ?? '');
        const postDid = trimify(matched?.[2] ?? '');
        if (!author || !postDid) return;
        const profile = await getBskyProfileByHandle(author);
        if (!profile) return;
        const postId = `${profile.profileId.replace('did:plc:', '')}_${postDid}`;
        return urlcat(SITE_URL, resolvePostUrl(source, postId));
    }
    if (postId) {
        return urlcat(SITE_URL, resolvePostUrl(source, postId));
    }
    return;
}

async function formatFarcasterUrl(url: URL) {
    if (url.pathname.includes('/channel')) {
        return captureChannelUrl(url, /^\/~\/channel\/([^/]+)$/u, Source.Farcaster);
    }

    if (FARCASTER_DETAIL_REGEX.test(url.href)) {
        return capturePostUrl(url, /^\/([^/]+)\/([^/]+)$/u, Source.Farcaster);
    }
    return captureProfileUrl(url, /^\/([^/]+)$/u, Source.Farcaster);
}

function formatHeyUrl(url: URL) {
    if (url.pathname.includes('/g/')) {
        return captureChannelUrl(url, /^\/g\/([^/]+)$/u, Source.Lens);
    }
    if (url.pathname.includes('/posts/')) {
        return capturePostUrl(url, /^\/posts\/([^/]+)$/u, Source.Lens);
    }
    return captureProfileUrl(url, /^\/u\/([^/]+)$/u, Source.Lens);
}

async function formatTwitterUrl(url: URL) {
    const profileUrl = await captureProfileUrl(url, /^\/([^/]+)$/u, Source.Twitter);
    if (profileUrl) return profileUrl;

    const matched = url.href.match(TWEET_REGEX);
    const tweetId = trimify(matched?.[3] ?? '');
    if (tweetId) {
        return urlcat(SITE_URL, resolvePostUrl(Source.Twitter, tweetId));
    }

    return;
}

async function formatBskyUrl(url: URL) {
    if (url.pathname.includes('/profile') && url.pathname.includes('/feed')) {
        return captureChannelUrl(url, /^\/profile\/([^/]+)\/feed\/([^/]+)$/u, Source.Bsky);
    }
    if (url.pathname.includes('/profile') && url.pathname.includes('/post/')) {
        return capturePostUrl(url, /^\/profile\/([^/]+)\/post\/([^/]+)$/u, Source.Bsky);
    }
    return captureProfileUrl(url, /^\/profile\/([^/]+)$/u, Source.Bsky);
}

export async function formatExternalLink(link: string) {
    const { siteType, parsedURL } = getSiteTypeFromUrl(link) ?? {};
    if (!siteType || !parsedURL) return;

    switch (siteType) {
        case ExternalSiteDomain.Warpcast:
        case ExternalSiteDomain.Farcaster:
            return formatFarcasterUrl(parsedURL);
        case ExternalSiteDomain.Hey:
            return formatHeyUrl(parsedURL);
        case ExternalSiteDomain.Twitter:
        case ExternalSiteDomain.X:
            return formatTwitterUrl(parsedURL);
        case ExternalSiteDomain.Bsky:
            return formatBskyUrl(parsedURL);
        default:
            safeUnreachable(siteType);
            return;
    }
}
