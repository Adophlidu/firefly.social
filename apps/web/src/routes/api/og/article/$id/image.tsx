import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequestContext } from '@dimensiondev/types';
import type { NextRequest } from '@/compat/next-server.js';
import { z } from 'zod';

import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getArticleById } from '@/providers/firefly/article/getArticleById.js';
import { getArticleCoverUrl } from '@/providers/firefly/metadata/getArticleCoverUrl.js';
import { createArticleOgImageResponse, loadArticleOgImages } from '@/services/og/createArticleOgImageResponse.js';
import type { OgAssets } from '@/services/og/loadOgAsset.js';

interface OgEnv {
    ASSETS: OgAssets;
}

const ParamsSchema = z.object({
    id: z.string().optional(),
});

const getHandler = async (request: NextRequest, context?: NextRequestContext, env?: OgEnv) => {
    const { id } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!id)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    const article = await getArticleById(id);
    if (!article)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    const assets = env!.ASSETS;
    const [coverUrl, images] = await Promise.all([getArticleCoverUrl(article), loadArticleOgImages(assets)]);

    return createArticleOgImageResponse({ article, coverUrl, images }, new URL(request.url).origin, assets);
};

export function GET({ request, params, env }: ApiContext<OgEnv>) {
    // withRequestErrorHandler's wrapper only forwards (request, context), so
    // bind env via closure instead of a third argument.
    const handler = withRequestErrorHandler()(((req: NextRequest, context?: NextRequestContext) =>
        getHandler(req, context, env)) as never) as (
        request: NextRequest,
        context?: NextRequestContext,
    ) => Promise<Response>;
    return handler(request as NextRequest, { params } as never);
}
