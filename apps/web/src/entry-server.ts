import { createWorkersHandler } from '@dimensiondev/ssr/cloudflare';
import clientAssets from 'virtual:ssr/client-assets';
import { modules, tree } from 'virtual:ssr/routes';

import { appMiddleware } from '@/middleware/index.js';

export default createWorkersHandler({
    tree,
    modules,
    middleware: appMiddleware,
    clientAssets,
});
