// localforage ships a UMD/CJS build whose named exports defeat both
// cjs-module-lexer (SSR dev externalization) and Vite's SSR bundle interop.
// Import the module namespace and unwrap the default export defensively —
// the interop shape differs between the dev SSR runner and the build.
import * as localforageModule from 'localforage';

type LocalForage = typeof import('localforage');

const localforage = ((localforageModule as { default?: LocalForage }).default ??
    localforageModule) as unknown as LocalForage;

export const createInstance: LocalForage['createInstance'] = localforage.createInstance.bind(localforage);

export default localforage;
