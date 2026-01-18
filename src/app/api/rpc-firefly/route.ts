import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getTruthSocialPostById } from '@/providers/firefly/endpoint/getTruthSocialPostById.js';
import { getWalletProfileByAddressOrEns } from '@/providers/firefly/endpoint/getWalletProfileByAddressOrEns.js';
import { getPostByShortId } from '@/providers/firefly/farcaster-hub/getPostByShortId.js';
import { FireflySession } from '@/providers/firefly/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';

const HeadersSchema = z.object({
    authorization: z.string().min(1, 'Unauthorized').optional(),
});

const BodySchema = z.object({
    method: z.string().min(1, 'Method name is required'),
    params: z.record(z.unknown()).optional().default({}),
});

// Method-specific parameter schemas
const MethodParamSchemas = {
    getPostByShortId: z.object({
        shortId: z.string(),
        handle: z.string(),
        profileId: z.string().nullable().optional(),
    }),
    getTruthSocialPostById: z.object({
        truthId: z.string(),
    }),
    getWalletProfileByAddressOrEns: z.object({
        addressOrEns: z.string(),
        isAuthRequired: z.boolean().default(false),
    }),
};

const availableMethods = {
    getPostByShortId,
    getTruthSocialPostById,
    getWalletProfileByAddressOrEns,
};

const availableMethodsList = Object.keys(MethodParamSchemas);

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { method, params } = await getJsonBodyWithZodSchema(request, BodySchema);

    // Check if method is supported
    if (!availableMethodsList.includes(method)) {
        return createErrorResponseJson(
            `Unsupported method: ${method}. Available methods: ${availableMethodsList.join(', ')}`,
            { status: 400 },
        );
    }

    // Validate method-specific parameters
    const methodSchema = MethodParamSchemas[method as keyof typeof MethodParamSchemas];
    const parsedParams = methodSchema.parse(params);

    // Extract Authorization header and initialize fireflySessionHolder if token exists
    const headers = getHeadersWithZodSchema(request, HeadersSchema);
    if (headers.authorization) {
        const token = headers.authorization.replace('Bearer ', '');
        if (!token) return createErrorResponseJson('Invalid Authorization header', { status: 400 });

        // Create a minimal FireflySession with the provided token
        // We use a dummy accountId since we only need the token for API calls
        const session = new FireflySession('dummy-account-id', token, null, null);
        fireflySessionHolder.resumeSession(session);
    }

    // Call the method on the FireflyEndpointProvider
    const result = await (availableMethods[method as keyof typeof availableMethods] as Function)(
        ...Object.values(parsedParams),
    );

    return createSuccessResponseJson({
        method,
        result,
    });
});
