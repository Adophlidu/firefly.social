
/**
 * Compatibility shim over @dimensiondev/ssr for components written against
 * next/navigation (via @bprogress/next's useRouter). The new SSR app aliases
 * `@/esm/navigation.js` here (see vite.config.ts); the Next.js app keeps the
 * original implementation.
 */
import {
    notFound,
    redirect,
    useNavigate,
    useParams,
    useRouterState,
    useSearch,
} from '@dimensiondev/ssr';
import { useMemo } from 'react';

export { notFound, redirect, useParams };

export const RedirectType = {
    push: 'push',
    replace: 'replace',
} as const;
export type RedirectType = (typeof RedirectType)[keyof typeof RedirectType];

interface RouterShim {
    push: (href: string) => void;
    replace: (href: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (href: string) => void;
}

export function useRouter(): RouterShim {
    const navigate = useNavigate();
    const { prefetch } = useRouterState();
    return useMemo(
        () => ({
            push: (href: string) => navigate(href),
            replace: (href: string) => navigate(href, { replace: true }),
            back: () => window.history.back(),
            forward: () => window.history.forward(),
            // Reload the current route's payload.
            refresh: () => navigate(window.location.pathname + window.location.search, { replace: true }),
            prefetch: (href: string) => prefetch?.(href),
        }),
        [navigate, prefetch],
    );
}

export function usePathname(): string {
    return useRouterState().pathname;
}

export function useSearchParams(): URLSearchParams {
    return useSearch();
}

/** Approximation of next/navigation's useSelectedLayoutSegments. */
export function useSelectedLayoutSegments(): string[] {
    const { pathname } = useRouterState();
    return pathname.split('/').filter(Boolean);
}
