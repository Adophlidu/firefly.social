import { anySignal } from '@dimensiondev/workers-shared/helpers/anySignal.js';
import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';
import type { Context } from 'hono';

const EMERGE_GENERATING_URL_PREFIX = 'https://emerge-mini-app.vercel.app/generating/';
const EMERGE_MINIAPP_HOST = 'emerge-mini-app.vercel.app';
const DEFAULT_FALLBACK_WORKFLOW_ID = '3b490bb0-0e85-4bad-966c-0626efdcdbb8';
const DEFAULT_FALLBACK_GENERATION_ID = '400a0b6a-82b6-4155-ace2-61ac7486624d';

interface FrameVersionPayload {
    imageUrl?: string;
    button?: {
        action?: {
            url?: string;
        };
    };
}

export interface FrameVersionModifierOptions {
    context?: Context;
    documentUrl?: string;
}

function toUrl(raw: string | undefined, base?: string): URL | null {
    if (!raw) return null;
    try {
        return base ? new URL(raw, base) : new URL(raw);
    } catch {
        return null;
    }
}

function extractGenerationId(url: URL): string | null {
    const matched = url.pathname.match(/^\/generating\/([0-9a-f-]{36})$/i);
    return matched?.[1] ?? null;
}

function buildFallbackImageUrl(actionUrlRaw: string | undefined): string {
    const actionUrl = toUrl(actionUrlRaw);
    const generationId = actionUrl ? extractGenerationId(actionUrl) : null;
    return `https://${EMERGE_MINIAPP_HOST}/api/workflow-og?id=${DEFAULT_FALLBACK_WORKFLOW_ID}&generationId=${generationId ?? DEFAULT_FALLBACK_GENERATION_ID}`;
}

async function fetchResource(url: string, context: Context, method: 'GET' | 'HEAD') {
    try {
        return await fetchWithContext(url, {
            method,
            context,
            signal: anySignal(context.req.raw.signal ?? null, AbortSignal.timeout(5000)),
        });
    } catch (error) {
        console.error(
            `[frame] emerge miniapp modifier failed to fetch ${url.toString()} (${method}): ${(error as Error).message}`,
            error,
        );
        return null;
    }
}

async function is404(url: string, context: Context): Promise<boolean> {
    const headResponse = await fetchResource(url, context, 'HEAD');
    if (!headResponse) return false;
    if (headResponse.status === 404) return true;

    return false;
}

async function applyEmergeMiniAppModifier(content: string, options: FrameVersionModifierOptions): Promise<string> {
    if (!options.context) return content;

    const payload = parseJson<FrameVersionPayload>(content);
    if (!payload?.imageUrl || !payload.button?.action?.url) return content;

    if (!(await is404(payload.imageUrl, options.context))) return content;

    return JSON.stringify({ ...payload, imageUrl: buildFallbackImageUrl(payload.button.action.url) });
}

export async function applyFrameVersionModifiers(
    content: string,
    options: FrameVersionModifierOptions = {},
): Promise<string> {
    if (options.documentUrl?.startsWith(EMERGE_GENERATING_URL_PREFIX)) {
        return applyEmergeMiniAppModifier(content, options);
    }
    return content;
}
