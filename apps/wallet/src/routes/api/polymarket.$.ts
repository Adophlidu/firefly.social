import { POLYMARKET_GAMMA_API_ROOT_URL } from '@dimensiondev/constants/static';

function withCorsHeaders(headers: Headers) {
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return headers;
}

function normalizePath(pathSegments: string | undefined) {
    if (!pathSegments) return '';
    return pathSegments
        .split('/')
        .map((s) => encodeURIComponent(s))
        .join('/');
}

async function proxy(request: Request, splatPath: string | undefined) {
    const upstreamUrl = new URL(`${POLYMARKET_GAMMA_API_ROOT_URL}/${normalizePath(splatPath)}`);

    const reqUrl = new URL(request.url);
    reqUrl.searchParams.forEach((value, key) => {
        upstreamUrl.searchParams.append(key, value);
    });

    const upstreamHeaders = new Headers();
    for (const [key, value] of request.headers.entries()) {
        const lower = key.toLowerCase();
        if (lower === 'host' || lower === 'content-length' || lower === 'connection') continue;
        upstreamHeaders.set(key, value);
    }

    if (!upstreamHeaders.has('accept')) upstreamHeaders.set('accept', 'application/json');

    const method = request.method.toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method);
    const body = hasBody ? await request.arrayBuffer() : undefined;

    const upstreamResp = await fetch(upstreamUrl, {
        method,
        headers: upstreamHeaders,
        body,
        // `cache: 'no-store'` is not implemented in the Workers runtime;
        // upstream responses are already marked no-store below.
        redirect: 'follow',
    });

    const headers = new Headers(upstreamResp.headers);
    headers.delete('content-encoding');
    headers.delete('content-length');
    headers.set('Cache-Control', 'no-store');
    withCorsHeaders(headers);

    const respBody = await upstreamResp.arrayBuffer();
    return new Response(respBody, {
        status: upstreamResp.status,
        headers,
    });
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: withCorsHeaders(new Headers()),
    });
}

interface ApiContext {
    request: Request;
    params: Record<string, string>;
}

export async function GET({ request, params }: ApiContext) {
    return proxy(request, params['*']);
}

export async function POST({ request, params }: ApiContext) {
    return proxy(request, params['*']);
}

export async function PUT({ request, params }: ApiContext) {
    return proxy(request, params['*']);
}

export async function PATCH({ request, params }: ApiContext) {
    return proxy(request, params['*']);
}

export async function DELETE({ request, params }: ApiContext) {
    return proxy(request, params['*']);
}
