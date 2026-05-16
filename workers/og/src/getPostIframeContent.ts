import { convertToTwitchEmbedUrl } from '@dimensiondev/workers-shared/helpers/convertTwitchToEmbedUrl.js';
import { convertToYouTubeEmbedUrl } from '@dimensiondev/workers-shared/helpers/convertYouTubeToEmbedUrl.js';
import { isYouTubeUrl } from '@dimensiondev/workers-shared/helpers/isYouTubeUrl.js';
import { parseUrl } from '@dimensiondev/workers-shared/helpers/parseUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';

// URLs that are manually picked to be embedded that don't have embed metatags
const pickUrlSites = ['open.spotify.com', 'kick.com', 'tiktok.com'];

const needClean = ['tiktok.com'];

const spotifyTrackUrlRegex = /^ht{2}ps?:\/{2}open\.spotify\.com\/track\/[\dA-Za-z]+(\?si=[\dA-Za-z]+)?$/;
const spotifyPlaylistUrlRegex = /^ht{2}ps?:\/{2}open\.spotify\.com\/playlist\/[\dA-Za-z]+(\?si=[\dA-Za-z]+)?$/;
const oohlalaUrlRegex = /^ht{2}ps?:\/{2}oohlala\.xyz\/playlist\/[\dA-Fa-f-]+(\?si=[\dA-Za-z]+)?$/;
const soundCloudRegex = /^ht{2}ps?:\/{2}soundcloud\.com(?:\/[\dA-Za-z-]+){2}(\?si=[\dA-Za-z]+)?$/;
const tapeRegex = /^https?:\/\/tape\.xyz\/watch\/[\dA-Za-z-]+(\?si=[\dA-Za-z]+)?$/;
const twitchRegex = /^https?:\/\/www\.twitch\.tv\/videos\/[\dA-Za-z-]+$/;
const kickRegex = /^https?:\/\/kick\.com\/[\dA-Za-z-]+$/;
const tiktokUserVideoRegex = /^https?:\/\/(?:www\.)?tiktok\.com\/@.+\/video\/[\dA-Za-z-]+$/;
const tiktokApiRegex = /^https?:\/\/(?:www\.)?tiktok\.com\/player\/v1\/[\dA-Za-z-]+/;

const universalSize = `width="100%" height="415"`;

export function getPostIframeContent(embedUrl: string | null, url: string, referer?: string): string | null {
    const parsedUrl = parseUrl(url);
    if (!parsedUrl) return null;

    const hostname = parsedUrl.hostname.replace('www.', '');
    const pickedUrl = pickUrlSites.includes(hostname) ? url : (embedUrl ?? url);
    // Remove query params from url
    const cleanedUrl = needClean.includes(hostname) ? (pickedUrl.split('?')[0] ?? pickedUrl) : url;

    if (!pickedUrl) {
        return null;
    }

    switch (hostname) {
        case 'youtube.com':
        case 'youtu.be': {
            if (isYouTubeUrl(cleanedUrl)) {
                const youtubeEmbedUrl = convertToYouTubeEmbedUrl(pickedUrl);
                return `<iframe src="${youtubeEmbedUrl}" ${universalSize} allow="accelerometer; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
            }

            return null;
        }
        case 'tape.xyz': {
            if (tapeRegex.test(cleanedUrl)) {
                return `<iframe src="${pickedUrl}" ${universalSize} allow="accelerometer; encrypted-media" allowfullscreen></iframe>`;
            }

            return null;
        }
        case 'twitch.tv': {
            if (twitchRegex.test(cleanedUrl)) {
                const parent = referer ? parseUrl(referer)?.hostname : undefined;
                const twitchEmbedUrl = convertToTwitchEmbedUrl(cleanedUrl, parent || 'firefly.social');
                if (!twitchEmbedUrl) return null;
                return `<iframe src="${twitchEmbedUrl}" ${universalSize} allowfullscreen></iframe>`;
            }

            return null;
        }
        case 'kick.com': {
            const kickEmbedUrl = pickedUrl.replace('kick.com', 'player.kick.com');
            if (kickRegex.test(cleanedUrl)) {
                return `<iframe src="${kickEmbedUrl}" ${universalSize} allowfullscreen></iframe>`;
            }

            return null;
        }
        case 'open.spotify.com': {
            const spotifySize = `style="max-width: 100%;" width="100%"`;
            if (spotifyTrackUrlRegex.test(cleanedUrl)) {
                const spotifyUrl = pickedUrl.replace('/track', '/embed/track');
                return `<iframe src="${spotifyUrl}" ${spotifySize} height="155" allow="encrypted-media"></iframe>`;
            }

            if (spotifyPlaylistUrlRegex.test(cleanedUrl)) {
                const spotifyUrl = pickedUrl.replace('/playlist', '/embed/playlist');
                return `<iframe src="${spotifyUrl}" ${spotifySize} height="380" allow="encrypted-media"></iframe>`;
            }

            return null;
        }
        case 'soundcloud.com': {
            if (soundCloudRegex.test(cleanedUrl)) {
                return `<iframe src="${pickedUrl}" ${universalSize}></iframe>`;
            }

            return null;
        }
        case 'oohlala.xyz': {
            if (oohlalaUrlRegex.test(cleanedUrl)) {
                return `<iframe src="${pickedUrl}" ${universalSize}></iframe>`;
            }

            return null;
        }
        case 'tiktok.com': {
            if (tiktokApiRegex.test(cleanedUrl)) {
                return `<iframe src="${pickedUrl}" ${universalSize} allowfullscreen></iframe>`;
            }
            if (tiktokUserVideoRegex.test(cleanedUrl)) {
                const videoId = cleanedUrl.split('/video/')[1];
                const videoUrl = urlcat('https://www.tiktok.com', `/player/v1/${videoId}`, {
                    music_info: 1,
                    description: 1,
                });
                return `<iframe src="${videoUrl}" ${universalSize} allowfullscreen></iframe>`;
            }
            return null;
        }
        default:
            console.warn(`No iframe reader for ${hostname}`);
            return null;
    }
}
