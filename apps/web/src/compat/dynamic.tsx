import { ClientOnly } from '@dimensiondev/ssr';
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';

interface DynamicOptions {
    ssr?: boolean;
    loading?: ComponentType;
}

/**
 * Compatibility shim for next/dynamic over React.lazy (+ ClientOnly for
 * `ssr: false`). The new SSR app aliases `@/esm/dynamic.js` here.
 */
export function dynamic<T extends ComponentType<any>>(
    importer: () => Promise<T | { default: T }>,
    options?: DynamicOptions,
): (props: Record<string, unknown>) => ReactNode {
    const LazyComponent = lazy(importer as () => Promise<{ default: T }>);
    const Fallback = options?.loading ?? (() => null);

    if (options?.ssr === false) {
        return function ClientOnlyDynamic(props) {
            return (
                <ClientOnly fallback={<Fallback />}>
                    <Suspense fallback={<Fallback />}>
                        <LazyComponent {...props} />
                    </Suspense>
                </ClientOnly>
            );
        };
    }

    return function LazyDynamic(props) {
        return (
            <Suspense fallback={<Fallback />}>
                <LazyComponent {...props} />
            </Suspense>
        );
    };
}
