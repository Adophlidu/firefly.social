import { parseUrl } from '@dimensiondev/utils';

const ALLOWED_EMBED_HOSTS = new Set([
    'youtube.com',
    'tape.xyz',
    'twitch.tv',
    'player.twitch.tv',
    'kick.com',
    'player.kick.com',
    'open.spotify.com',
    'soundcloud.com',
    'w.soundcloud.com',
    'oohlala.xyz',
    'tiktok.com',
]);

const SINGLE_IFRAME_RE = /^<iframe\s+([^>]+)>\s*<\/iframe>$/i;

function getIframeAttribute(attributes: string, name: string) {
    const match = attributes.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i'));
    return match?.[1];
}

function normalizeHostname(hostname: string) {
    return hostname.replace(/^www\./, '').toLowerCase();
}

export interface ParsedEmbedPlayerIframe {
    src: string;
    height: number;
    allow?: string;
    allowFullScreen?: boolean;
    referrerPolicy?: string;
    style?: string;
}

export function parseEmbedPlayerIframe(html: string): ParsedEmbedPlayerIframe | null {
    const trimmed = html.trim();
    if (!trimmed) return null;

    const match = trimmed.match(SINGLE_IFRAME_RE);
    if (!match) return null;

    const attributes = match[1];
    const src = getIframeAttribute(attributes, 'src');
    if (!src) return null;

    const parsedSrc = parseUrl(src);
    if (parsedSrc?.protocol !== 'https:') return null;

    const hostname = normalizeHostname(parsedSrc.hostname);
    if (!ALLOWED_EMBED_HOSTS.has(hostname)) return null;

    const heightValue = getIframeAttribute(attributes, 'height');
    const height = heightValue ? Number.parseInt(heightValue, 10) : 415;
    if (!Number.isFinite(height) || height <= 0 || height > 2000) return null;

    const allow = getIframeAttribute(attributes, 'allow');
    const referrerPolicy = getIframeAttribute(attributes, 'referrerpolicy');
    const style = getIframeAttribute(attributes, 'style');
    const allowFullScreen = /\sallowfullscreen(?:\s|>|$)/i.test(attributes);

    return {
        src,
        height,
        allow,
        allowFullScreen: allowFullScreen || undefined,
        referrerPolicy,
        style,
    };
}
