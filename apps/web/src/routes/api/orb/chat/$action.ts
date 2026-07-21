import { envs } from '@dimensiondev/envs/web';
import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequestContext } from '@dimensiondev/types';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { ORB_CHAT_API_URL, ORB_QUERIES_API_URL } from '@/providers/orb/chat/constants.js';

const HeadersSchema = z.object({
    'x-access-token': z.string().min(1, 'No Lens access token.'),
});

const ParamsSchema = z.object({
    action: z.enum([
        'create-chat',
        'get-interactive-action',
        'get-channel-counters',
        'get-chat-channel',
        'get-chat-channels',
        'get-chat-messages',
        'mark-message-as-read',
        'search',
        'send-message',
    ]),
});

const QUERY_ACTIONS = new Set<z.infer<typeof ParamsSchema>['action']>(['search']);
const InteractiveActionBodySchema = z.object({ interactiveActionId: z.string().min(1) });
const ChatTokenEnvelopeSchema = z.object({
    status: z.string().optional(),
    data: z.object({ token: z.string().optional() }).nullish(),
    msg: z.string().optional(),
});
const InteractiveActionRowSchema = z.object({
    amount: z.union([z.number(), z.string()]).nullish(),
    currency_symbol: z.string().nullish(),
    status: z.string().nullish(),
    metadata: z.object({ message: z.string().nullish() }).passthrough().nullish(),
});

const ORB_SUPABASE_URL = envs.internal.ORB_SUPABASE_URL;
const ORB_SUPABASE_ANON_KEY = envs.internal.ORB_SUPABASE_ANON_KEY;

function createOrbHeaders(accessToken: string) {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        origin: 'https://orb.club',
        referer: 'https://orb.club/',
        'x-access-token': accessToken,
    };
}

async function getInteractiveAction(accessToken: string, request: NextRequest) {
    const { interactiveActionId } = InteractiveActionBodySchema.parse(await request.json());
    const tokenResponse = await fetch(`${ORB_CHAT_API_URL}/create-chat-token`, {
        method: 'POST',
        headers: createOrbHeaders(accessToken),
        body: '{}',
    });
    if (!tokenResponse.ok) {
        return Response.json({ status: 'FAILED', msg: 'Failed to create chat token' });
    }

    const tokenPayload = ChatTokenEnvelopeSchema.safeParse(await tokenResponse.json());
    if (!tokenPayload.success) return Response.json({ status: 'FAILED', msg: 'Invalid chat token response' });

    const token = tokenPayload.data.data?.token;
    if (!token || tokenPayload.data.status === 'FAILED') {
        return Response.json({ status: 'FAILED', msg: tokenPayload.data.msg });
    }

    const search = new URLSearchParams({
        select: 'amount,currency_symbol,status,metadata',
        id: `eq.${interactiveActionId}`,
        limit: '1',
    });
    const detailResponse = await fetch(`${ORB_SUPABASE_URL}/rest/v1/interactive_actions?${search}`, {
        headers: {
            Accept: 'application/json',
            apikey: ORB_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
        },
    });
    if (!detailResponse.ok) {
        return Response.json({ status: 'FAILED', msg: 'Failed to load payment request' });
    }

    const rows = z.array(InteractiveActionRowSchema).parse(await detailResponse.json());
    const row = rows[0];
    const amount = row?.amount === null || row?.amount === undefined ? null : Number(row.amount);
    return Response.json({
        status: 'SUCCESS',
        data: row
            ? {
                  amount: Number.isFinite(amount) ? amount : null,
                  currencySymbol: row.currency_symbol ?? null,
                  status: row.status ?? null,
                  message: row.metadata?.message ?? null,
              }
            : null,
    });
}

async function postHandler(request: NextRequest, context: NextRequestContext) {
    const { 'x-access-token': accessToken } = getHeadersWithZodSchema(request, HeadersSchema);
    const { action } = await getParamsWithZodSchema(ParamsSchema, context);
    if (action === 'get-interactive-action') return getInteractiveAction(accessToken, request);

    const baseUrl = QUERY_ACTIONS.has(action) ? ORB_QUERIES_API_URL : ORB_CHAT_API_URL;
    const upstreamResponse = await fetch(`${baseUrl}/${action}`, {
        method: 'POST',
        headers: createOrbHeaders(accessToken),
        body: await request.text(),
    });

    return new Response(await upstreamResponse.arrayBuffer(), {
        status: upstreamResponse.status,
        headers: {
            'Cache-Control': 'no-store',
            'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json',
        },
    });
}

export function POST({ request, params }: ApiContext) {
    return postHandler(request as NextRequest, { params: Promise.resolve(params) });
}
