import type { SportLiveStreamInfo } from '@/types/prediction.js';

export type SportLivestreamPlayback =
    | {
          type: 'embed';
          embedUrl: string;
          sourceUrl: string;
      }
    | {
          type: 'external';
          url: string;
      };

function cleanUrl(url: string | undefined): string | undefined {
    const trimmed = url?.trim();
    return trimmed ? trimmed : undefined;
}

function resolveTwitchEmbedUrl(url: string | undefined, parent: string): string | undefined {
    if (!url) return undefined;

    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();

        if (hostname === 'player.twitch.tv' || (hostname === 'clips.twitch.tv' && parsed.pathname === '/embed')) {
            parsed.searchParams.set('parent', parent);
            parsed.searchParams.set('muted', 'true');
            return parsed.toString();
        }
    } catch {
        return undefined;
    }

    const videoMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
    if (videoMatch) {
        return `https://player.twitch.tv/?video=${videoMatch[1]}&parent=${parent}&autoplay=false&muted=true`;
    }

    const channelMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)\/?$/);
    if (channelMatch && channelMatch[1] !== 'videos') {
        return `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${parent}&autoplay=false&muted=true`;
    }

    const clipMatch =
        url.match(/clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/) || url.match(/twitch\.tv\/\w+\/clip\/([a-zA-Z0-9_-]+)/);
    if (clipMatch) {
        return `https://clips.twitch.tv/embed?clip=${clipMatch[1]}&parent=${parent}&autoplay=false&muted=true`;
    }

    return undefined;
}

export function isTwitchLivestreamUrl(url: string | undefined): boolean {
    if (!url?.trim()) return false;
    return !!resolveTwitchEmbedUrl(url.trim(), 'localhost');
}

export function resolveSportLivestreamPlayback(
    livestreamInfo: SportLiveStreamInfo | undefined,
    parent: string,
): SportLivestreamPlayback | undefined {
    const livestreamUrl = cleanUrl(livestreamInfo?.livestreamUrl);
    const playerUrl = cleanUrl(livestreamInfo?.playerUrl);
    const sourceUrl = livestreamUrl || playerUrl;
    if (!sourceUrl) return undefined;

    if (livestreamInfo?.inWhiteList !== false) {
        const embedUrl = resolveTwitchEmbedUrl(playerUrl, parent) || resolveTwitchEmbedUrl(livestreamUrl, parent);
        if (embedUrl) {
            return {
                type: 'embed',
                embedUrl,
                sourceUrl,
            };
        }
    }

    return {
        type: 'external',
        url: sourceUrl,
    };
}
