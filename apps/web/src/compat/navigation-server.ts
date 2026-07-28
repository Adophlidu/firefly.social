import { notFound, redirect as ssrRedirect } from '@dimensiondev/ssr';

export { notFound };

export const RedirectType = {
    push: 'push',
    replace: 'replace',
} as const;
export type RedirectType = (typeof RedirectType)[keyof typeof RedirectType];

/**
 * next/navigation's redirect(): `replace` maps to a 307 (temporary, the
 * default), `push` to a 308 (permanent). Numeric Next.js status codes pass
 * through unchanged.
 */
export function redirect(url: string, type: RedirectType | 301 | 302 | 307 | 308 = RedirectType.replace): never {
    const status = typeof type === 'number' ? type : type === RedirectType.push ? 308 : 307;
    return ssrRedirect(url, status);
}
