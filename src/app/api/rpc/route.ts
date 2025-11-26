import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { SourceInURL } from '@/constants/enum.js';
import { AccountSuspendedError, NotFoundError } from '@/constants/error.js';
import {
    createErrorResponseJson,
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@/helpers/createResponseJson.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSourceFromUrl } from '@/helpers/resolveSource.js';

// Base schema for all RPC requests
const BodySchema = z.object({
    method: z.string().min(1, 'Method name is required'),
    source: z.nativeEnum(SourceInURL),
    params: z.record(z.unknown()).optional().default({}),
});

const IndicatorSchema = z.object({
    id: z.string().optional(),
    cursor: z.string().optional(),
});

// Method-specific parameter schemas - only supporting metadata route methods
const MethodParamSchemas = {
    getProfileByIdOrHandle: z.object({
        profileIdOrHandle: z.string(),
        includeGraphStats: z.boolean().optional(),
    }),
    getProfileByHandle: z.object({
        handle: z.string(),
        includeGraphStats: z.boolean().optional(),
    }),
    getPostById: z.object({
        postId: z.string(),
    }),
    getProfilesByIds: z.object({
        ids: z.array(z.string()),
    }),
    getChannelById: z.object({
        channelId: z.string(),
        includeFollowingStatus: z.boolean().optional(),
        ownerId: z.string().optional(),
    }),
    getChannelsByIds: z.object({
        ids: z.array(z.string()),
    }),
    getSuggestedFollows: z.object({
        indicator: IndicatorSchema.optional(),
    }),
    discoverChannels: z.object({
        indicator: IndicatorSchema.optional(),
    }),
};

// Available methods mapping
const availableMethods = Object.keys(MethodParamSchemas);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const parsedRequest = BodySchema.safeParse(body);
        if (!parsedRequest.success) {
            return createZodErrorResponseJson(parsedRequest.error, { status: 400 });
        }

        const { method, source, params } = parsedRequest.data;
        console.log(`[/api/rpc] method: ${method}, source: ${source}, params: ${JSON.stringify(params)}`);

        // Check if method is supported
        if (!availableMethods.includes(method)) {
            return createErrorResponseJson(
                `Unsupported method: ${method}. Available methods: ${availableMethods.join(', ')}`,
                { status: 400 },
            );
        }

        // Validate method-specific parameters
        const methodSchema = MethodParamSchemas[method as keyof typeof MethodParamSchemas];
        const parsedParams = methodSchema.safeParse(params);
        if (!parsedParams.success) {
            return createZodErrorResponseJson(parsedParams.error, {
                status: 400,
            });
        }

        // Resolve the social media provider
        const provider = resolveSocialMediaProvider(resolveSocialSourceFromUrl(source));

        // Check if the method exists on the provider
        if (typeof provider[method as keyof typeof provider] !== 'function') {
            return createErrorResponseJson(`Method ${method} is not available on the ${source} provider`, {
                status: 400,
            });
        }

        // Call the method on the provider
        const result = await (provider[method as keyof typeof provider] as Function)(
            ...Object.values(parsedParams.data),
        );

        return createSuccessResponseJson({
            method,
            source,
            result,
        });
    } catch (error) {
        const isNotFoundError = error instanceof NotFoundError;
        const isAccountSuspendedError = error instanceof AccountSuspendedError;

        if (!isNotFoundError && !isAccountSuspendedError) {
            console.error('RPC API Error:', error);
        }

        return createErrorResponseJson(error instanceof Error ? error.message : 'Internal server error', {
            status: 500,
        });
    }
}
