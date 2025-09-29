import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import {
    createErrorResponseJson,
    createSuccessResponseJson,
    createZodErrorResponseJson,
} from '@/helpers/createResponseJson.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySession } from '@/providers/firefly/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';

// Base schema for all Firefly RPC requests
const BaseFireflyRPCSchema = z.object({
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
};

// Available methods mapping
const availableMethods = Object.keys(MethodParamSchemas);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsedRequest = BaseFireflyRPCSchema.safeParse(body);

        if (!parsedRequest.success) {
            return createZodErrorResponseJson(parsedRequest.error, { status: 400 });
        }

        const { method, params } = parsedRequest.data;

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

        // Extract Authorization header and initialize fireflySessionHolder if token exists
        const authHeader = request.headers.get('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            if (!token) return createErrorResponseJson('Invalid Authorization header', { status: 400 });

            // Create a minimal FireflySession with the provided token
            // We use a dummy accountId since we only need the token for API calls
            const session = new FireflySession('dummy-account-id', token, null, null);
            fireflySessionHolder.resumeSession(session);
        }

        // Call the method on the FireflyEndpointProvider
        const result = await (FireflyEndpointProvider[method as keyof typeof FireflyEndpointProvider] as Function)(
            ...Object.values(parsedParams.data),
        );

        return createSuccessResponseJson({
            method,
            result,
        });
    } catch (error) {
        console.error('Firefly RPC API Error:', error);
        return createErrorResponseJson(error instanceof Error ? error.message : 'Internal server error', {
            status: 500,
        });
    }
}
