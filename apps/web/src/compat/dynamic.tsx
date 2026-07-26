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
    // next/dynamic accepts both a component directly and a module object;
    // React.lazy requires `{ default }`, so normalize.
    const LazyComponent = lazy(async () => {
        const resolved = (await importer()) as T | { default: T };
        const component =
            resolved && typeof resolved === 'object' && 'default' in resolved
                ? (resolved as { default: T }).default
                : (resolved as T);
        return { default: component };
    });
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
