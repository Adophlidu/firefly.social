import type { ComponentType, ReactElement, ReactNode } from 'react';

import { RouterContext } from './context.ts';
import type { RouteModuleMap } from './types.ts';

/**
 * Route module export names with framework meaning. Any other function-valued
 * export is treated as layout slot content (see `<Slot>`).
 */
const RESERVED_EXPORTS = new Set([
    'default',
    'loader',
    'head',
    'config',
    'errorComponent',
    'notFoundComponent',
    'pendingComponent',
    // API route handlers
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS',
    'middleware',
]);

/**
 * Collect layout slot content from the matched chain's modules. Files are
 * applied root-first, so a slot exported by a page (or a deeper layout)
 * overrides the same slot from an outer layout. Slot exports are components,
 * not elements — they resolve at render time like page components.
 */
export function collectSlots(files: string[], modules: RouteModuleMap): Record<string, ComponentType> {
    const slots: Record<string, ComponentType> = {};
    for (const file of files) {
        const routeModule = modules[file] as Record<string, unknown> | undefined;
        if (!routeModule) continue;

        for (const [name, value] of Object.entries(routeModule)) {
            if (RESERVED_EXPORTS.has(name)) continue;
            if (typeof value === 'function') slots[name] = value as ComponentType;
        }
    }

    return slots;
}

export interface SlotProps {
    /** The slot name to render, e.g. `sidebar`. */
    name: string;
    /** Rendered when no module in the matched chain fills this slot. */
    fallback?: ReactNode;
}

/**
 * Renders the slot content contributed by the matched chain (see
 * `collectSlots`), or `fallback` when nothing fills it. Place in layouts to
 * let pages inject content into named regions — the replacement for
 * Next.js parallel routes.
 */
export function Slot({ name, fallback = null }: SlotProps): ReactElement | null {
    return (
        <RouterContext.Consumer>
            {(state) => {
                const Content = state?.slots?.[name];
                return Content ? <Content /> : (fallback as ReactElement | null);
            }}
        </RouterContext.Consumer>
    );
}
