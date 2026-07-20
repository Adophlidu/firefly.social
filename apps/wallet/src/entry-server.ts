import { createWorkersHandler } from '@dimensiondev/ssr/cloudflare';
import clientAssets from 'virtual:ssr/client-assets';
import { modules, tree } from 'virtual:ssr/routes';

export default createWorkersHandler({
    tree,
    modules,
    basepath: process.env.NEXT_PUBLIC_BASE_PATH ?? '/wallet-iframe',
    clientAssets,
});
