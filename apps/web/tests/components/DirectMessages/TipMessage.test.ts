/// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { TipMessage } from '@/components/DirectMessages/TipMessage.js';

const { useDmInteractiveActionMock } = vi.hoisted(() => ({ useDmInteractiveActionMock: vi.fn() }));

vi.mock('@dimensiondev/assets/dollar.svg', () => ({ default: () => null }));
vi.mock('@lingui/core/macro', () => ({ t: (strings: TemplateStringsArray) => strings[0] }));
vi.mock('@lingui/react/macro', () => ({ Trans: ({ children }: { children?: unknown }) => children }));
vi.mock('@/hooks/useDirectMessages.js', () => ({
    useDmInteractiveAction: (...args: unknown[]) => useDmInteractiveActionMock(...args),
}));

afterEach(() => {
    cleanup();
    useDmInteractiveActionMock.mockReset();
});

describe('TipMessage', () => {
    test('keeps its fixed card size while loading details', () => {
        useDmInteractiveActionMock.mockReturnValue({ data: undefined, isLoading: true });
        const { container } = render(
            createElement(TipMessage, { account: '0xviewer', interactiveActionId: 'tip-1', isSelf: false }),
        );

        expect(screen.getByLabelText('Loading payment request')).toBeTruthy();
        expect(container.firstElementChild?.className).toContain('h-[286px]');
    });

    test('renders read-only payment request details without a payment button', () => {
        useDmInteractiveActionMock.mockReturnValue({
            data: { amount: 1, currencySymbol: 'GHO', status: 'PENDING', message: null },
            isLoading: false,
        });
        render(createElement(TipMessage, { account: '0xviewer', interactiveActionId: 'tip-1', isSelf: false }));

        expect(screen.getByText('Requested')).toBeTruthy();
        expect(screen.getByText('$1')).toBeTruthy();
        expect(screen.getByText('1 $GHO')).toBeTruthy();
        expect(screen.getByText('Pending')).toBeTruthy();
        expect(screen.queryByRole('button')).toBeNull();
    });

    test('uses a stable fallback when details are unavailable', () => {
        useDmInteractiveActionMock.mockReturnValue({ data: null, isLoading: false });
        render(createElement(TipMessage, { account: '0xviewer', interactiveActionId: 'tip-1', isSelf: false }));

        expect(screen.getByText('Payment request details unavailable')).toBeTruthy();
    });
});
