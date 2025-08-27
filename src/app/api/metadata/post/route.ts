import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { SourceInURL } from '@/constants/enum.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSourceFromUrl } from '@/helpers/resolveSource.js';

const SearchParamsSchema = z.object({
    id: z.string(),
    source: z.nativeEnum(SourceInURL),
});

export async function GET(request: NextRequest) {
    const parsedParams = SearchParamsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    if (!parsedParams.success) return createErrorResponseJson(parsedParams.error.message, { status: 400 });

    const { id, source } = parsedParams.data;

    const provider = resolveSocialMediaProvider(resolveSocialSourceFromUrl(source));
    const post = await provider.getPostById(id).catch(() => null);

    return createSuccessResponseJson({
        post,
    });
}
