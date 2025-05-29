import { z } from 'zod';

import { anySignal } from '@/helpers/anySignal.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { parseUrl } from '@/helpers/parseUrl.js';

/**
 * Schema for Farcaster account association
 * @see https://miniapps.farcaster.xyz/docs/specification#schema-2
 */
export const AccountAssociationSchema = z.object({
    /**
     * base64 encoded JFS header
     */
    header: z.string(),
    /**
     * base64 encoded payload
     */
    payload: z.string(),
    /**
     * base64 encoded signature
     */
    signature: z.string(),
});

/**
 * Schema for Farcaster JSON frame
 * @see https://miniapps.farcaster.xyz/docs/specification#frame
 */
export const FrameSchema = z.object({
    /**
     * Must be '1'
     */
    version: z.literal('1'),
    /**
     * Max length 32 characters
     */
    name: z.string().max(32),
    /**
     * Max length 1024 characters
     */
    homeUrl: z.string().url().max(1024),
    /**
     * Max length 1024 characters. Image must be 1024x1024px PNG, no alpha (not enforceable in zod)
     */
    iconUrl: z.string().url().max(1024),
    /**
     * [DEPRECATED] Max length 1024 characters. Image must be 3:2 aspect ratio (not enforceable in zod)
     */
    imageUrl: z.string().url().max(1024).optional(),
    /**
     * [DEPRECATED] Max length 32 characters
     */
    buttonTitle: z.string().max(32).optional(),
    /**
     * Max length 1024 characters. Must be 200x200px (not enforceable in zod)
     */
    splashImageUrl: z.string().url().max(1024).optional(),
    /**
     * Hex color code
     */
    splashBackgroundColor: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .optional(),
    /**
     * Max length 1024 characters. Must be set if notifications are used (not enforceable in zod)
     */
    webhookUrl: z.string().url().max(1024).optional(),
    /**
     * Max 30 characters, no emojis or special characters (basic enforcement)
     */
    subtitle: z
        .string()
        .max(30)
        .regex(/^[\w\s\-.,:;'"()!?]+$/)
        .optional(),
    /**
     * Max 170 characters, no emojis or special characters (basic enforcement)
     */
    description: z
        .string()
        .max(170)
        .regex(/^[\w\s\-.,:;'"()!?]+$/)
        .optional(),
    /**
     * Max 3 screenshots. Each should be 1284x2778 portrait (not enforceable in zod)
     */
    screenshotUrls: z.array(z.string().url()).max(3).optional(),
    /**
     * Primary category
     */
    primaryCategory: z
        .enum([
            'games',
            'social',
            'finance',
            'utility',
            'productivity',
            'health-fitness',
            'news-media',
            'music',
            'shopping',
            'education',
            'developer-tools',
            'entertainment',
            'art-creativity',
        ])
        .optional(),
    /**
     * Max 5 tags. Each tag: Lowercase, no spaces, no special characters, no emojis, max 20 characters
     */
    tags: z
        .array(
            z
                .string()
                .max(20)
                .regex(/^[a-z0-9-]+$/),
        )
        .max(5)
        .optional(),
    /**
     * 1200 x 630px (1.91:1) (not enforceable in zod)
     */
    heroImageUrl: z.string().url().optional(),
    /**
     * Max 30 characters
     */
    tagline: z.string().max(30).optional(),
    /**
     * Max 30 characters
     */
    ogTitle: z.string().max(30).optional(),
    /**
     * Max 100 characters
     */
    ogDescription: z.string().max(100).optional(),
    /**
     * 1200 x 630px (1.91:1) PNG (not enforceable in zod)
     */
    ogImageUrl: z.string().url().optional(),
    /**
     * true to exclude from search results, false to include (default)
     */
    noindex: z.boolean().optional(),
    /**
     * Only chains listed in chainList are supported (not enforceable in zod)
     */
    requiredChains: z.array(z.string()).optional(),
    /**
     * Each entry must be a path to an SDK method (not enforceable in zod)
     */
    requiredCapabilities: z.array(z.string()).optional(),
});

export const FarcasterJsonSchema = z.object({
    accountAssociation: AccountAssociationSchema,
    frame: FrameSchema,
});

export async function fetchFarcasterJson(url: string, signal?: AbortSignal) {
    const u = parseUrl(url);
    if (!u || u.protocol !== 'https:' || u.hostname === 'warpcast.com' || u.hostname === 'farcaster.xyz') return null;

    const farcasterJsonUrl = `${u.protocol}//${u.hostname}/.well-known/farcaster.json`;
    const response = await fetchJSON(farcasterJsonUrl, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
        signal: anySignal(signal ?? null, AbortSignal.timeout(3000)),
    });

    const parsed = FarcasterJsonSchema.safeParse(response);
    if (!parsed.success) {
        console.error(`[farcasterJson] invalid farcaster.json: ${parsed.error.message}`);
        return null;
    }

    return parsed.data;
}
