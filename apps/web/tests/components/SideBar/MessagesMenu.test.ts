/// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { MessagesMenu } from '@/components/SideBar/MessagesMenu.js';

const { useActiveDmIdentityMock, useDmCountersMock } = vi.hoisted(() => ({
    useActiveDmIdentityMock: vi.fn(),
    useDmCountersMock: vi.fn(),
}));

vi.mock('@dimensiondev/assets/messages.svg', () => ({ default: () => null }));
vi.mock('@lingui/core/macro', () => ({
    t: (strings: TemplateStringsArray) => strings[0],
    plural: (count: number, forms: { one: string; other: string }) =>
        (count === 1 ? forms.one : forms.other).split('#').join(String(count)),
}));
vi.mock('@lingui/react/macro', () => ({ Trans: ({ children }: { children?: unknown }) => children }));
vi.mock('@/components/SideBar/BaseMenuItem.js', () => ({
    BaseMenuItem: ({ icon, menuName }: { icon: ReactNode; menuName: ReactNode }) =>
        createElement('div', null, icon, menuName),
}));
vi.mock('@/hooks/useDmSession.js', () => ({
    // A logged-in Lens account is authenticated for DM, so authenticatedAccount is just the active
    // account. Replicate that here so the sidebar's counter gating is exercised.
    useAuthenticatedDmAccount: () => {
        const identity = useActiveDmIdentityMock();
        const account = identity?.account;
        return { identity, account, authenticatedAccount: account };
    },
    useDmCounters: (...args: unknown[]) => useDmCountersMock(...args),
}));

afterEach(() => {
    cleanup();
    useActiveDmIdentityMock.mockReset();
    useDmCountersMock.mockReset();
});

describe('MessagesMenu', () => {
    test('does not enable counters when there is no active Lens account', () => {
        useActiveDmIdentityMock.mockReturnValue(null);
        useDmCountersMock.mockReturnValue({ data: undefined });

        render(createElement(MessagesMenu, { isSelected: false, collapsed: false }));

        expect(useDmCountersMock).toHaveBeenCalledWith(undefined);
        expect(screen.queryByLabelText(/unread messages/)).toBeNull();
    });

    test('shows the total unread message count instead of the unread conversation count', () => {
        useActiveDmIdentityMock.mockReturnValue({ account: '0xA' });
        useDmCountersMock.mockReturnValue({
            data: { total_unread_count: 52, total_unread_dms_count: 1 },
        });

        render(createElement(MessagesMenu, { isSelected: false, collapsed: false }));

        expect(screen.getByLabelText('52 unread messages')).toBeTruthy();
        expect(screen.getByText('52')).toBeTruthy();
    });

    test('uses only the active account and caps its unread count', () => {
        let account = '0xA';
        useActiveDmIdentityMock.mockImplementation(() => ({ account }));
        useDmCountersMock.mockImplementation((activeAccount: string | undefined) => ({
            data: { total_unread_count: activeAccount === '0xA' ? 120 : 2 },
        }));

        const view = render(createElement(MessagesMenu, { isSelected: false, collapsed: false }));
        expect(useDmCountersMock).toHaveBeenLastCalledWith('0xA');
        expect(screen.getByText('99+')).toBeTruthy();

        account = '0xB';
        view.rerender(createElement(MessagesMenu, { isSelected: true, collapsed: false }));

        expect(useDmCountersMock).toHaveBeenLastCalledWith('0xB');
        expect(screen.queryByText('99+')).toBeNull();
        expect(screen.getByText('2')).toBeTruthy();
    });
});
