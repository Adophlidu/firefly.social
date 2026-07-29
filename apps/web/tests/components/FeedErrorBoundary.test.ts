// @vitest-environment jsdom

import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lingui/react/macro', () => ({ Trans: ({ children }: { children?: ReactNode }) => children }));

import { FeedErrorBoundary } from '@/components/FeedErrorBoundary.js';

function ThrowingChild(): never {
    throw new Error('api failed');
}

describe('FeedErrorBoundary', () => {
    let container: HTMLElement;
    let root: ReturnType<typeof createRoot>;

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        document.body.innerHTML = '';
    });

    function render(children: ReactNode) {
        (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        act(() => {
            root.render(children);
        });
        return container;
    }

    it('shows the retry fallback instead of crashing when a child throws', () => {
        const html = render(createElement(FeedErrorBoundary, null, createElement(ThrowingChild)));
        expect(html.textContent).toContain('Failed to load');
        expect(html.querySelector('button')).not.toBeNull();
    });

    it('retry remounts the children', () => {
        let shouldThrow = true;
        function MaybeThrow() {
            if (shouldThrow) throw new Error('api failed');
            return createElement('p', null, 'content-ok');
        }
        const html = render(createElement(FeedErrorBoundary, null, createElement(MaybeThrow)));
        expect(html.textContent).toContain('Failed to load');

        shouldThrow = false;
        act(() => {
            html.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(html.textContent).toContain('content-ok');
    });
});
