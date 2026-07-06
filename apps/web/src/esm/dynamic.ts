// @ts-expect-error next/dynamic has no declaration for the bare module path used by this ESM shim
import NextDynamic from 'next/dynamic';

export const dynamic: typeof import('next/dynamic.js').default = NextDynamic;
