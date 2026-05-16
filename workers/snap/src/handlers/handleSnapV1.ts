import {
    createErrorResponseJson,
    createSuccessResponseJson,
} from '@dimensiondev/workers-shared/helpers/createResponseJson.js';
import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';
import type { Context } from 'hono';

import { SNAP_CONTENT_TYPE } from '@/snap/src/digestSnapUrl.js';
import { generateJFS } from '@/snap/src/generateJFS.js';
import type { Snap, SnapDigestedResponse } from '@/snap/src/types.js';

interface SnapBindings {
    Bindings: { SNAP_CACHE: KVNamespace; TCO_CACHE: KVNamespace };
}

interface SnapV1JsonBody {
    profileId: string;
    token: string;
    payload: {
        fid: number;
        button_index: number;
        nonce?: string;
        inputs: Record<string, unknown>;
        timestamp: number;
    };
}

type SnapV1Payload = SnapV1JsonBody['payload'];

interface SnapV1Input {
    in: {
        query: { url: string; target: string };
        json: SnapV1JsonBody;
    };
    out: {
        query: { url: string; target: string };
        json: SnapV1JsonBody;
    };
}

type SnapV1Context = Context<SnapBindings, string, SnapV1Input>;

async function submitSnapV1(c: SnapV1Context, token: string, payload: SnapV1Payload) {
    const { url, target } = c.req.valid('query');
    const jfs = await generateJFS(token, payload);
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
    if (parsed?.version !== '1.0' || !parsed.ui?.root) {
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

export async function handleSnapV1(c: SnapV1Context) {
    const { token, payload } = c.req.valid('json');
    const { nonce: _nonce, ...normalizedPayload } = payload;
    return submitSnapV1(c, token, normalizedPayload);
}
