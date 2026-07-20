/// <reference types="vite/client" />

declare module 'virtual:ssr/routes' {
    import type { RouteModuleLoaders, RouteTree } from '@dimensiondev/ssr';

    export const tree: RouteTree;
    export const modules: RouteModuleLoaders;
}

declare module 'virtual:ssr/client-assets' {
    import type { ClientAssets } from '@dimensiondev/ssr';

    const clientAssets: ClientAssets;
    export default clientAssets;
}
