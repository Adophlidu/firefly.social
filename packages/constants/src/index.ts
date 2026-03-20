export const EMPTY_LIST = Object.freeze([]) as never[];
export const EMPTY_OBJECT = Object.freeze({}) as Record<string, never>;

/** Matches `VERCEL_ENV` in the app and `NEXT_PUBLIC_VERCEL_ENV` default in env schema. */
const NEXT_PUBLIC_VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development';

export const IS_PRODUCTION = NEXT_PUBLIC_VERCEL_ENV === 'production';
export const IS_DEVELOPMENT = NEXT_PUBLIC_VERCEL_ENV === 'development';
export const IS_PREVIEW = NEXT_PUBLIC_VERCEL_ENV === 'preview';
