import { ClientOnly } from '@dimensiondev/ssr';
import { useEffect, useState, type ComponentType, type ReactElement, type ReactNode } from 'react';

interface DynamicOptions {
    ssr?: boolean;
    loading?: ComponentType;
}

type Loadable = () => Promise<ComponentType>;

const componentCache = new Map<Loadable, ComponentType>();
const registeredLoadables: Loadable[] = [];

/**
 * Resolve and cache every registered dynamic importer. Call once before
 * hydration: streamed suspense boundaries (already resolved on the server)
 * then render synchronously on the client and match the server DOM —
 * without it React reports hydration error #419.
 */
export function preloadDynamics(): Promise<unknown[]> {
    return Promise.all(registeredLoadables.map((loadable) => loadable()));
}

function normalize<T extends ComponentType>(resolved: T | { default: T }): T {
    return resolved && typeof resolved === 'object' && 'default' in resolved
        ? (resolved as { default: T }).default
        : (resolved as T);
}

/**
 * Compatibility shim for next/dynamic. Unlike React.lazy, it resolves
 * synchronously once preloaded (see preloadDynamics), which full-document
 * hydration with out-of-order suspense boundaries requires.
 */
export function dynamic<P extends object = Record<string, unknown>>(
    importer: () => Promise<ComponentType<P> | { default: ComponentType<P> } | Record<string, unknown>>,
    options?: DynamicOptions,
): ComponentType<P> {
    const loadable: Loadable = async () => {
        const cached = componentCache.get(loadable);
        if (cached) return cached as ComponentType;
        const component = normalize((await importer()) as ComponentType | { default: ComponentType });
        componentCache.set(loadable, component);
        return component;
    };
    registeredLoadables.push(loadable);

    const Fallback: ComponentType = options?.loading ?? (() => null);

    function DynamicComponent(props: P): ReactElement | null {
        const [Component, setComponent] = useState<ComponentType<P> | null>(
            () => (componentCache.get(loadable) ?? null) as ComponentType<P> | null,
        );
        useEffect(() => {
            if (Component) return;
            let mounted = true;
            void loadable().then((component) => {
                if (mounted) setComponent(() => component as ComponentType<P>);
            });
            return () => {
                mounted = false;
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        if (Component) return <Component {...props} />;
        if (options?.ssr === false) return <Fallback />;
        // Not loaded yet: suspend (React renders the fallback / streams the
        // boundary); the thrown promise is memoized via componentCache.
        throw loadable();
    }

    return DynamicComponent;
}
