import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

export interface ClientOnlyProps {
    children?: ReactNode;
    /** Rendered on the server and before hydration completes. */
    fallback?: ReactNode;
}

/**
 * Render children only on the client. Use for subtrees that cannot run
 * during SSR (browser-only libraries, wallet connectors, …).
 */
export function ClientOnly(props: ClientOnlyProps): ReactNode {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted ? props.children : (props.fallback ?? null);
}
