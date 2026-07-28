import { createWorkersHandler } from '@dimensiondev/ssr/cloudflare';
import clientAssets from 'virtual:ssr/client-assets';
import { modules, tree } from 'virtual:ssr/routes';

import { appMiddleware } from '@/middleware/index.js';
import { resolveRequestLocale } from '@/helpers/resolveRequestLocale.js';

export default createWorkersHandler({
    tree,
    modules,
    middleware: appMiddleware,
    clientAssets,
    // Anonymous pages render per-locale content from Accept-Language —
    // include the resolved locale in the edge cache key. Cookied requests
    // bypass the edge cache entirely (handled by the library).
    cacheVary: (request) => [resolveRequestLocale(request)],
});
