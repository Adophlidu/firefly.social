import { createWorkersHandler } from '@dimensiondev/ssr/cloudflare';
import clientAssets from 'virtual:ssr/client-assets';
import { modules, tree } from 'virtual:ssr/routes';

export default createWorkersHandler({
    tree,
    modules,
    clientAssets,
});
