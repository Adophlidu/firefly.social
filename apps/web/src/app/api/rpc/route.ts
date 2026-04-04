import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';
import { z } from 'zod';

import { SourceInURL } from '@/constants/enum.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSourceFromUrl } from '@/helpers/resolveSource.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

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
        ids: z.array(z.string()).max(299, 'Maximum 299 ids allowed'),
    }),
    getChannelById: z.object({
        channelId: z.string(),
        includeFollowingStatus: z.boolean().optional(),
        ownerId: z.string().optional(),
    }),
    getChannelsByIds: z.object({
        ids: z.array(z.string()).max(299, 'Maximum 299 ids allowed'),
    }),
    getSuggestedFollows: z.object({
        includeFollowingStatus: z.boolean().optional(),
        locale: z.string().optional(),
        indicator: IndicatorSchema.optional(),
    }),
    discoverChannels: z.object({
        indicator: IndicatorSchema.optional(),
    }),
};

// Available methods mapping
const availableMethods = Object.keys(MethodParamSchemas);

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { method, source, params } = await getJsonBodyWithZodSchema(request, BodySchema);

    // Check if method is supported
    if (!availableMethods.includes(method)) {
        return createErrorResponseJson(
            `Unsupported method: ${method}. Available methods: ${availableMethods.join(', ')}`,
            { status: 400 },
        );
    }

    // Validate method-specific parameters
    const methodSchema = MethodParamSchemas[method as keyof typeof MethodParamSchemas];
    const parsedParams = methodSchema.parse(params);

    // Resolve the social media provider
    const provider = resolveSocialMediaProvider(resolveSocialSourceFromUrl(source));

    // Check if the method exists on the provider
    if (typeof provider[method as keyof typeof provider] !== 'function') {
        return createErrorResponseJson(`Method ${method} is not available on the ${source} provider`, {
            status: 400,
        });
    }

    // Call the method on the provider
    const result = await (provider[method as keyof typeof provider] as Function)(...Object.values(parsedParams));

    return createSuccessResponseJson({
        method,
        source,
        result,
    });
});
