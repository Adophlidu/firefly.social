/* cspell:disable */

import { parseUrl } from '@/helpers/parseUrl.js';

const blockedHostSet = new Set([
    'www.youtube.com',
    'youtube.com',
    'youtu.be',
    'm.youtube.com',
    'www.google.com',
    'google.com',
    'x.com',
    't.me',
    't.co',
    'firefly.social',
    'firefly.mask.social',
    'staging.firefly.social',
    'canary.firefly.social',
    'firefly-staging.mask.social',
    'firefly-canary.mask.social',
    'warpcast.com',
    'apple.com',
    'discord.gg',
    'twitter.com',
    'github.com',
    'bsky.app',
    'docs.google.com',
    'apps.apple.com',
    'jup.ag',
    'okx.com',
    'www.okx.com',
    'binance.com',
    'www.binance.com',
    'www.bybit.com',
    'bybit.com',
    'notion.so',
]);

const regexList = [/.bsky.social$/, /.twitter$/, /.eth$/];

export function isBlinkBlocklist(url: string) {
    const urlObj = parseUrl(url.startsWith('https://') ? url : `https://${url}`);
    if (!urlObj) return true;
    if (regexList.some((regex) => regex.test(url))) return true;
    return blockedHostSet.has(urlObj.host);
}
