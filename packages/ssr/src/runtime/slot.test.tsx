// @vitest-environment jsdom

import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { composeMatch } from './compose.tsx';
import { collectSlots, Slot } from './slot.tsx';
import { createMatcher } from '../router/matcher.ts';
import { buildRouteTree } from '../router/tree.ts';
import type { RouteModuleMap } from './types.ts';

const FILES = ['__root.tsx', '_layout.tsx', 'index.tsx', 'about.tsx'];
const tree = buildRouteTree({ files: FILES });
const match = createMatcher(tree);

function LayoutWithSlots({ children }: { children?: React.ReactNode }) {
    return (
        <div>
            <aside>
                <Slot name="sidebar" fallback={<span>default-sidebar</span>} />
            </aside>
            <section>
                <Slot name="subnav" />
            </section>
            {children}
        </div>
    );
}

function makeModules(overrides: Partial<RouteModuleMap>): RouteModuleMap {
    return {
        '__root.tsx': { default: (props: { children?: React.ReactNode }) => <>{props.children}</> },
        '_layout.tsx': { default: LayoutWithSlots },
        'index.tsx': { default: () => <p>home</p> },
        'about.tsx': { default: () => <p>about</p> },
        ...overrides,
    };
}

function render(modules: RouteModuleMap, url: string): string {
    const matched = match(url)!;
    const element = composeMatch({
        match: matched,
        modules,
        data: {},
        heads: [],
        pathname: url,
        search: new URLSearchParams(),
    });
    return renderToString(element);
}

describe('layout slots', () => {
    it('collectSlots skips framework exports and lets inner modules override', () => {
        const Sidebar = () => <b>layout-sidebar</b>;
        const PageSidebar = () => <b>page-sidebar</b>;
        const modules = makeModules({
            '_layout.tsx': { default: LayoutWithSlots, sidebar: Sidebar, loader: () => ({}) } as never,
            'index.tsx': { default: () => <p>home</p>, sidebar: PageSidebar } as never,
        });
        const slots = collectSlots(['__root.tsx', '_layout.tsx', 'index.tsx'], modules);
        expect(slots.sidebar).toBe(PageSidebar);
        expect(slots.loader).toBeUndefined();
    });

    it('renders the fallback when nothing fills the slot', () => {
        const html = render(makeModules({}), '/');
        expect(html).toContain('default-sidebar');
    });

    it('renders layout-provided slot content', () => {
        const modules = makeModules({
            '_layout.tsx': { default: LayoutWithSlots, sidebar: () => <b>layout-sidebar</b> } as never,
        });
        const html = render(modules, '/');
        expect(html).toContain('layout-sidebar');
        expect(html).not.toContain('default-sidebar');
    });

    it('page slot content overrides the layout for its own subtree only', () => {
        const modules = makeModules({
            '_layout.tsx': { default: LayoutWithSlots, sidebar: () => <b>layout-sidebar</b> } as never,
            'about.tsx': { default: () => <p>about</p>, sidebar: () => <b>page-sidebar</b> } as never,
        });
        expect(render(modules, '/')).toContain('layout-sidebar');
        expect(render(modules, '/about')).toContain('page-sidebar');
        expect(render(modules, '/about')).not.toContain('layout-sidebar');
    });

    it('empty slots render nothing without a fallback', () => {
        const html = render(makeModules({}), '/');
        expect(html).toContain('<section></section>');
    });
});

describe('useLoaderData group fallback', () => {
    it('matches loader data group-insensitively when the file moved', async () => {
        const { RouterContext } = await import('./context.ts');
        const { useLoaderData } = await import('./context.ts');
        const { useContext } = await import('react');
        let observed: unknown;
        function Probe() {
            observed = useLoaderData('profile/$source/$id/_layout.tsx');
            return null;
        }
        const state = {
            pathname: '/',
            search: new URLSearchParams(),
            params: {},
            files: ['(normal)/profile/$source/$id/_layout.tsx'],
            data: { '(normal)/profile/$source/$id/_layout.tsx': { ok: true } },
            heads: [],
        };
        renderToString(
            <RouterContext value={state as never}>
                <Probe />
            </RouterContext>,
        );
        expect(observed).toEqual({ ok: true });
    });
});
