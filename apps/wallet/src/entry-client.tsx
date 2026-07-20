import { hydrateApp } from '@dimensiondev/ssr/client';
import { modules, tree } from 'virtual:ssr/routes';

void hydrateApp({
    tree,
    modules,
    // The wallet runs inside an iframe: keep navigation in memory, never touch the URL bar.
    history: 'memory',
    basepath: import.meta.env.NEXT_PUBLIC_BASE_PATH ?? '/wallet-iframe',
});
