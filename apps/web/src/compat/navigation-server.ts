export { notFound, redirect } from '@dimensiondev/ssr';

export const RedirectType = {
    push: 'push',
    replace: 'replace',
} as const;
export type RedirectType = (typeof RedirectType)[keyof typeof RedirectType];
