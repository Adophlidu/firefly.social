/**
 * Import layers (high → low): app / components / modals → hooks → services & providers → store.
 * Lower layers must not import higher UI layers so state and IO stay reusable and testable.
 */
export const importArchitecturalLayerZones = [
    {
        target: './apps/web/src/store',
        from: ['./apps/web/src/components', './apps/web/src/hooks', './apps/web/src/modals', './apps/web/src/app'],
        message:
            'Store is a low layer: do not import components, hooks, modals, or the Next app directory. Use helpers, services, providers, or types instead.',
    },
    {
        target: './apps/web/src/providers',
        from: ['./apps/web/src/components', './apps/web/src/hooks', './apps/web/src/modals'],
        message:
            'Providers sit below UI: do not import components, hooks, or modals. Prefer helpers, types, or lifting UI-specific code (e.g. modal refs) to services/hooks.',
    },
    {
        target: './apps/web/src/services',
        from: ['./apps/web/src/components', './apps/web/src/hooks', './apps/web/src/modals'],
        message: 'Services orchestrate domain work: do not import components, hooks, or modals.',
    },
    {
        target: './apps/web/src/hooks',
        from: ['./apps/web/src/components', './apps/web/src/modals'],
        message:
            'Hooks compose data and effects: do not import components or modals (use helpers or colocate UI logic in components).',
    },
];
