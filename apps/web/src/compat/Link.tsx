import { Link as SsrLink } from '@dimensiondev/ssr';
import type { AnchorHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';

/**
 * Compatibility shim over @dimensiondev/ssr's Link for components written
 * against next/link. The new SSR app aliases `@/esm/Link.js` here (see
 * vite.config.ts). `replace` and `scroll` are accepted for prop
 * compatibility but not yet honored by the library's Link.
 */
interface LinkCompatProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    replace?: boolean;
    scroll?: boolean;
    prefetch?: boolean;
    /** next/link routing option; ignored by the SSR router. */
    shallow?: boolean;
    children?: ReactNode;
    ref?: Ref<HTMLAnchorElement>;
}

export type LinkProps = LinkCompatProps;

export function Link({ href, replace: _replace, scroll: _scroll, shallow: _shallow, prefetch, ...rest }: LinkCompatProps): ReactElement {
    return <SsrLink href={href} prefetch={prefetch} {...rest} />;
}
