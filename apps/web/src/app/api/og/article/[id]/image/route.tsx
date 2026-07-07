import type { NextRequestContext } from '@dimensiondev/types';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getArticleById } from '@/providers/firefly/article/getArticleById.js';
import { getArticleCoverUrl } from '@/providers/firefly/metadata/getArticleCoverUrl.js';
import { createArticleOpenGraphImageResponse } from '@/services/createArticleOpenGraphImageResponse.js';

const ParamsSchema = z.object({
    id: z.string().optional(),
});

export const GET = compose(withRequestErrorHandler(), async (_request: NextRequest, context?: NextRequestContext) => {
    const { id } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!id) return createProxyImageResponse(getDefaultOgImageUrl());

    const article = await getArticleById(id);
    if (!article) return createProxyImageResponse(getDefaultOgImageUrl());

    const coverUrl = await getArticleCoverUrl(article);

    return createArticleOpenGraphImageResponse({ article, coverUrl });
});
