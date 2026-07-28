import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequestContext } from '@dimensiondev/types';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { searchToken } from '@/providers/firefly/worker/searchToken.js';
import { createTokenOgImageResponse, loadTokenOgImages } from '@/services/og/createTokenOgImageResponse.js';
import type { OgAssets } from '@/services/og/loadOgAsset.js';

interface OgEnv {
    ASSETS: OgAssets;
}

const ParamsSchema = z.object({
    chainId: z.coerce.number().optional(),
    address: z.string().optional(),
});

const getHandler = async (request: NextRequest, context?: NextRequestContext, env?: OgEnv) => {
    const { chainId, address } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!chainId || !address)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    const token = await searchToken({ chain_id: chainId, address });
    if (!token)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    const assets = env!.ASSETS;
    const images = await loadTokenOgImages(assets);

    return createTokenOgImageResponse({ token, chainId, images, assets }, new URL(request.url).origin);
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
