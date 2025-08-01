import { ExternalSiteDomain, type SocialSource, Source } from '@/constants/enum.js';
import { TWEET_REGEX } from '@/constants/regexp.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getUrlSiteType } from '@/helpers/interceptExternalUrl.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { trimify } from '@/helpers/trimify.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';

async function captureProfileUrl(url: URL, regex: RegExp, source: SocialSource) {
    const { pathname } = url;

    const matched = regex.exec(pathname);
    const handle = trimify(matched?.[1] ?? '');
    if (handle) {
        return getProfileUrl({ source, handle });
    }

    return;
}

async function captureClubUrl(url: URL, regex: RegExp, source: SocialSource) {
    const { pathname } = url;
    const matched = regex.exec(pathname);
    if (source === Source.Bsky) {
        const author = trimify(matched?.[1] ?? '');
        const feedName = trimify(matched?.[2] ?? '');
        const profile = await BskySocialMediaProvider.getProfileByHandle(author);
        if (!profile) return;
        const channelDid = `${profile.profileId.replace('did:plc:', '')}_${feedName}`;
        return resolveChannelUrl(channelDid, source);
    }

    const handle = trimify(matched?.[1] ?? '');
    if (handle) {
        return resolveChannelUrl(handle, source);
    }

    return;
}

async function formatFarcasterUrl(url: URL) {
    if (url.pathname.includes('/club')) {
        return captureClubUrl(url, /^\/~\/channel\/([^/]+)$/u, Source.Farcaster);
    }
    return captureProfileUrl(url, /^\/([^/]+)$/u, Source.Farcaster);
}

function formatHeyUrl(url: URL) {
    if (url.pathname.includes('/g/')) {
        return captureProfileUrl(url, /^\/g\/([^/]+)$/u, Source.Lens);
    }
    return captureProfileUrl(url, /^\/u\/([^/]+)$/u, Source.Lens);
}

async function formatTwitterUrl(url: URL) {
    const profileUrl = await captureProfileUrl(url, /^\/([^/]+)$/u, Source.Twitter);
    if (profileUrl) return profileUrl;

    const matched = url.href.match(TWEET_REGEX);
    const tweetId = trimify(matched?.[3] ?? '');
    if (tweetId) {
        return resolvePostUrl(Source.Twitter, tweetId);
    }

    return;
}

async function formatBskyUrl(url: URL) {
    if (url.pathname.includes('/profile') && url.pathname.includes('/feed')) {
        return captureClubUrl(url, /^\/profile\/([^/]+)\/feed\/([^/]+)$/u, Source.Bsky);
    }
    return captureProfileUrl(url, /^\/profile\/([^/]+)$/u, Source.Bsky);
}

export async function formatExternalLink(link: string) {
    const { siteType, parsedURL } = getUrlSiteType(link) ?? {};
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
