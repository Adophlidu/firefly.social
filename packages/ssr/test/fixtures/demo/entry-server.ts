import { createServerHandler } from '@dimensiondev/ssr/server';
import clientAssets from 'virtual:ssr/client-assets';
import { modules, tree } from 'virtual:ssr/routes';

export default createServerHandler({ tree, modules, clientAssets });
