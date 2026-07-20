import { hydrateApp } from '@dimensiondev/ssr/client';
import { modules, tree } from 'virtual:ssr/routes';

void hydrateApp({ tree, modules });
