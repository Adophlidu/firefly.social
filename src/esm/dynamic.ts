// @ts-expect-error
import NextDynamic from 'next/dynamic';

export const dynamic: typeof import('next/dynamic.js').default = NextDynamic;
