import { attemptUntil } from '@dimensiondev/workers-shared/helpers/attemptUntil.js';
import type { Context } from 'hono';

import { NITTER_INSTANCES } from '@/x/src/identity/constants.js';

// Different browser headers configurations to avoid detection
const BROWSER_HEADERS: Array<Record<string, string>> = [
    {
        'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
    },
    {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
    },
    {
        'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        DNT: '1',
    },
    {
        'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    },
    {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        DNT: '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
    },
];

/**
 * Resolve X user ID to username using nitter instances
 *
 * @param userId - The X user REST ID
 * @param c - Hono context
 * @returns Username if found, null otherwise
 */
export async function resolveIdentity(userId: string, _: Context): Promise<string | null> {
    const attempts: Array<() => Promise<string | null>> = NITTER_INSTANCES.map((instance) => async () => {
        try {
            const url = `${instance}/i/user/${userId}`;

            // Use random headers for each instance to avoid detection
            const headersIndex = Math.floor(Math.random() * BROWSER_HEADERS.length);
            const headers = BROWSER_HEADERS[headersIndex];

            // Use direct fetch with browser-like headers to bypass anti-bot
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                headers,
            });

            if (!response.ok) {
                return null;
            }

            // Check if response is Anubis challenge page
            const text = await response.text();
            if (text.includes('Making sure you') && (text.includes('anubis') || text.includes('anubis_challenge'))) {
                console.log(`[resolveIdentity] Anubis challenge detected from ${instance}, skipping`);
                return null;
            }

            // Get the final URL after redirects
            const finalUrl = response.url;
            // Remove query parameters and hash
            const urlWithoutQuery = finalUrl.split('?')[0].split('#')[0];
            const urlParts = urlWithoutQuery.split('/').filter(Boolean);
            const username = urlParts.at(-1);

            // Validate username: should not be empty, not equal to userId, and should be a valid username format
            if (
                username &&
                username !== userId &&
                username !== 'i' &&
                username !== 'user' &&
                /^[a-zA-Z0-9_]+$/.test(username)
            ) {
                return username;
            }

            return null;
        } catch (error) {
            console.error(`[resolveIdentity] Error with instance ${instance}:`, error);
            return null;
        }
    });

    // Prepend Firefly API as primary resolver
    attempts.unshift(async () => {
        try {
            const response = await fetch(`https://api.firefly.land/v2/twitter/get-user?ids=${userId}`);
            if (!response.ok) return null;

            const json = (await response.json()) as {
                data?: Array<{ handle?: string }>;
            };
            const handle = json.data?.[0]?.handle;
            if (handle && /^[a-zA-Z0-9_]+$/.test(handle)) {
                return handle;
            }
            return null;
        } catch (error) {
            console.error(`[resolveIdentity] Firefly API failed:`, error);
            return null;
        }
    });

    try {
        const result = await attemptUntil(attempts, null, (result) => result === null || result === undefined);
        return result;
    } catch (error) {
        console.error(`[resolveIdentity] All attempts failed for userId: ${userId}`, error);
        return null;
    }
}
