import {
    createErrorResponseJson,
    createSuccessResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';
import { parseUrl } from '@dimensiondev/workers-shared/helpers/parseUrl.js';
import type { Context } from 'hono';

import { SNAP_CONTENT_TYPE } from '@/snap/src/digestSnapUrl.js';
import { generateJFS } from '@/snap/src/generateJFS.js';
import type { Snap, SnapDigestedResponse, SnapJFSPayload } from '@/snap/src/types.js';

interface SnapBindings {
    Bindings: { SNAP_CACHE: KVNamespace; TCO_CACHE: KVNamespace };
}

interface SnapV2JsonBody {
    profileId: string;
    token: string;
    payload: {
        audience: string;
        user: { fid: number };
        surface: string | Record<string, unknown>;
        fid?: number;
        nonce?: string;
        inputs: Record<string, unknown>;
        timestamp: number;
    } & Record<string, unknown>;
}

interface SnapV2Input {
    in: {
        query: { url: string; target: string };
        json: SnapV2JsonBody;
    };
    out: {
        query: { url: string; target: string };
        json: SnapV2JsonBody;
    };
}

type SnapV2Context = Context<SnapBindings, string, SnapV2Input>;

function normalizeSnapSurface(surface: string | Record<string, unknown>): Record<string, unknown> {
    if (typeof surface === 'string') {
        if (surface === 'cast') return { type: 'cast' };
        if (surface === 'standalone') return { type: 'standalone' };
        return { type: 'standalone' };
    }

    if (surface.type === 'cast') return surface;
    if (surface.type === 'standalone') return surface;

    // Legacy clients may send values like `cast_embed`; normalize to a valid spec surface.
    return { ...surface, type: 'standalone' };
}

function toOrigin(url: string) {
    const parsed = parseUrl(url);
    return parsed?.origin ?? url;
}

async function submitSnapV2(c: SnapV2Context, token: string, payload: SnapJFSPayload) {
    const { url, target } = c.req.valid('query');
    const normalizedPayload: SnapJFSPayload = {
        ...payload,
        audience: payload.audience ? toOrigin(payload.audience) : toOrigin(target),
    };
    const jfs = await generateJFS(token, normalizedPayload);
    const response = await fetchWithContext(target, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: SNAP_CONTENT_TYPE,
        },
        body: jfs,
        context: c,
    });

    if (!response.ok) {
        const text = await response.text();
        console.error(`[snap] submit failed: ${response.status}\n${text}`);
        return createErrorResponseJson('The snap server failed to process the request.', { status: 400 });
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes(SNAP_CONTENT_TYPE)) {
        return createErrorResponseJson('Unexpected response content type from snap server.', { status: 400 });
    }

    const responseText = await response.text();
    const parsed = parseJson<Partial<Snap>>(responseText);
    if (parsed?.version !== '2.0' || !parsed.ui?.root) {
        return createErrorResponseJson('Invalid snap response from server.', { status: 400 });
    }

    const result: SnapDigestedResponse = {
        snap: {
            url,
            version: parsed.version,
            theme: parsed.theme,
            effects: parsed.effects,
            ui: parsed.ui,
        },
    };
    return createSuccessResponseJson(result);
}

export async function handleSnapV2(c: SnapV2Context) {
    const { token, payload } = c.req.valid('json');
    const normalizedPayload: SnapJFSPayload = {
        ...payload,
        fid: payload.fid ?? payload.user.fid,
        nonce: payload.nonce ?? crypto.randomUUID(),
        surface: normalizeSnapSurface(payload.surface),
    };
    return submitSnapV2(c, token, normalizedPayload);
}
