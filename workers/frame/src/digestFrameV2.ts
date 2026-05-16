import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';
import { runInSafeAsync } from '@dimensiondev/workers-shared/helpers/runInSafe.js';
import { unescapeHtmlEntities } from '@dimensiondev/workers-shared/helpers/unescapeHtmlEntities.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';
import z from 'zod';

import { fetchFarcasterJson } from '@/frame/src/fetchFarcasterJson.js';
import type { FrameV2 } from '@/frame/src/types.js';

const FrameV2Schema = z.object({
    version: z.string(),
    imageUrl: z.string().max(1024, 'Max 1024 characters'),
    button: z.object({
        title: z.string().max(32, 'Max length of 32 characters'),
        action: z.object({
            type: z.union([z.literal('launch_frame'), z.literal('launch_miniapp'), z.literal('link')]),
            name: z.string().max(32, 'Max length of 32 characters'),
            url: z.string().max(512, 'Max 512 characters').default(''),
            splashImageUrl: z.string().max(512, 'Max 512 characters').default(''),
            splashBackgroundColor: z
                .string()
                .regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, 'Hex color code')
                .default('#000000'),
        }),
    }),
});

export async function digestFrameV2(url: string, version: string, c: Context): Promise<FrameV2 | null> {
    const payload = parseJson<FrameV2>(version);
    console.log(`[frame] digesting frame v2 for ${url}: ${JSON.stringify(payload, null, 2)}.`);

    const parsed = FrameV2Schema.safeParse(payload);
    if (!parsed.success) throw parsed.error;

    const json = await runInSafeAsync(() => fetchFarcasterJson(url, c));
    console.log(`[frame] farcasterJson: ${json ? 'found' : 'not found'} for ${url}.`);

    // merge with farcaster.json if available
    const frame: FrameV2 = {
        ...parsed.data,
        x_url: url,
        x_version: 2,
        x_manifest: json,
        button: {
            ...parsed.data.button,
            title: unescapeHtmlEntities(parsed.data.button.title),
            action: {
                ...parsed.data.button.action,
                url: parsed.data.button.action.url.startsWith('/')
                    ? urlcat(url, parsed.data.button.action.url)
                    : parsed.data.button.action.url,
                name: unescapeHtmlEntities(parsed.data.button.action.name),
            },
        },
    };
    if (!frame.button.action.url) {
        frame.button.action.url = url;
    }
    return frame;
}
