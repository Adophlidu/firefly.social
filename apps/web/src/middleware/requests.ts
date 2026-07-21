import { FIREFLY_ROOT_URL, FIREFLY_ROOT_URL_DEV } from '@dimensiondev/constants/static';
import type { MiddlewareFn } from '@dimensiondev/ssr';

import { EXTERNAL_REWRITE_PREFIXES } from '@/middleware/external.js';
import { hasLocalePrefix } from '@/helpers/stripLocalePathname.js';
import { resolveLanguageLocale } from '@/helpers/resolveLocale.js';
import { Locale } from '@dimensiondev/enums';

const SUPPORTED_LOCALES = Object.values(Locale) as string[];

const BOT_PATTERN = /bot|spider|crawl|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkshare|whatsapp|telegrambot|discordbot/i;

/**
 * Header/cookie helpers middleware: bot flag for /post pages and search
 * params forwarding for /token pages.
 */
export const requestAnnotations: MiddlewareFn = (request, { next }) => {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/post') && !url.pathname.includes('/photos')) {
        const ua = request.headers.get('user-agent') ?? '';
        const headers = new Headers(request.headers);
        headers.set('X-IS-BOT', BOT_PATTERN.test(ua) ? 'true' : 'false');
        return next(new Request(request, { headers }));
    }

    if (url.pathname.startsWith('/token/') && url.searchParams.size > 0) {
        const headers = new Headers(request.headers);
        headers.set('X-SEARCH-PARAMS', url.searchParams.toString());
        return next(new Request(request, { headers }));
    }

    return next();
};

const DEVICE_ID_COOKIE = 'firefly_device_id';
const SHARER_SID_COOKIE = 'firefly_sharer_sid';
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24h, matches SHARER_SESSION_TTL

function resolveApiUrl() {
    const isDev = process.env.NEXT_PUBLIC_FIREFLY_DEV_API === 'enabled';
    return isDev ? FIREFLY_ROOT_URL_DEV : FIREFLY_ROOT_URL;
}

function cookieHeader(): string {
    return `Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Referral ?sid= tracking: device/sharer cookies + fire-and-forget event. */
export const referralTracking: MiddlewareFn = async (request, { next }) => {
    const url = new URL(request.url);
    const sid = url.searchParams.get('sid');

    const response = await next();
    if (!sid) return response;

    const inviterSid = sid.trim();
    // Inviter sid may be a numeric ff uid OR an alphanumeric marketing sid — mirror the backend charset.
    if (!inviterSid || !/^[a-zA-Z0-9_-]+$/.test(inviterSid)) return response;

    const cookieStore = request.headers.get('cookie') ?? '';
    const hasDeviceId = new RegExp(`(?:^|;\\s*)${DEVICE_ID_COOKIE}=`).test(cookieStore);
    const deviceId = hasDeviceId
        ? (cookieStore.match(new RegExp(`${DEVICE_ID_COOKIE}=([^;]*)`))?.[1] ?? crypto.randomUUID())
        : crypto.randomUUID();

    if (!hasDeviceId) {
        response.headers.append('set-cookie', `${DEVICE_ID_COOKIE}=${deviceId}; ${cookieHeader()}`);
    }
    response.headers.append('set-cookie', `${SHARER_SID_COOKIE}=${inviterSid}; ${cookieHeader()}`);

    // Fire-and-forget tracking event
    fetch(new URL('/v1/referral/track/event', resolveApiUrl()), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            inviter_uid: inviterSid,
            invitee_device_id: deviceId,
            landing_url: request.url,
        }),
    }).catch(() => {});

    return response;
};

// Paths that must not get a locale prefix (API routes, short links, proxies, static files).
const LOCALE_EXCLUDED_PREFIXES = [
    '/api',
    '/i',
    '/.well-known',
    '/font',
    '/image',
    '/music',
    '/svg',
    '/webm',
    '/assets',
    '/js',
    ...EXTERNAL_REWRITE_PREFIXES,
];
const STATIC_FILE_PATTERN = /\.(?:svg|png|jpg|jpeg|gif|webp|js|css|map|ico|xml|txt|ttf|otf|woff|woff2|mp3|mp4|webm|webmanifest|json)$/;

function resolveLocale(request: Request): string {
    const cookieStore = request.headers.get('cookie') ?? '';
    const localeCookie = cookieStore.match(/(?:^|;\s*)locale=([^;]*)/)?.[1];
    if (localeCookie && SUPPORTED_LOCALES.includes(decodeURIComponent(localeCookie))) {
        return decodeURIComponent(localeCookie);
    }
    const acceptLanguage = request.headers.get('accept-language')?.split(',')[0];
    return resolveLanguageLocale(acceptLanguage);
}

/**
 * Locale prefix rewrite: `/post/x/1` → `/en/post/x/1` (locale from cookie →
 * Accept-Language → 'en'). Already-prefixed, API, and static paths pass through.
 */
export const localeRewrite: MiddlewareFn = (request, { next }) => {
    const url = new URL(request.url);
    const { pathname } = url;

    if (hasLocalePrefix(pathname)) return next();
    if (LOCALE_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return next();
    if (STATIC_FILE_PATTERN.test(pathname)) return next();

    const locale = resolveLocale(request);
    const destination = new URL(`/${locale}${pathname === '/' ? '' : pathname}${url.search}`, request.url);
    return next(new Request(destination, request));
};
