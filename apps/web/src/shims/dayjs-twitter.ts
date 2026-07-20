// dayjs-twitter ships only a UMD build whose export is a webpack-style
// `{ __esModule: true, default: plugin }` object. The interop shape differs
// between the dev SSR module runner, the SSR bundle and the client bundle,
// so unwrap `.default` until the actual plugin function falls out.
import * as dayjsTwitterModule from 'dayjs-twitter';

type DayjsPlugin = typeof import('dayjs/plugin/duration.js');

let plugin: unknown = dayjsTwitterModule;
for (let i = 0; i < 3 && plugin && typeof plugin !== 'function'; i += 1) {
    const next = (plugin as { default?: unknown }).default;
    if (next === plugin) break;
    plugin = next ?? plugin;
}

export default plugin as DayjsPlugin;
