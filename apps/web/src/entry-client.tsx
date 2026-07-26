import { hydrateApp } from '@dimensiondev/ssr/client';
import { modules, tree } from 'virtual:ssr/routes';

import { rewriteLocalePathname } from '@/helpers/rewriteLocalePathname.js';

void hydrateApp({
    tree,
    modules,
    history: 'browser',
    rewritePathname: rewriteLocalePathname,
});
