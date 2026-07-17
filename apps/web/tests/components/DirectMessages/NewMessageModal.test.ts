/// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { NewMessageModal } from '@/components/DirectMessages/NewMessageModal.js';
import type { DirectMessageContact } from '@/components/DirectMessages/types.js';

const { profileSearchMock } = vi.hoisted(() => ({ profileSearchMock: vi.fn() }));

vi.mock('@dimensiondev/assets/search.svg', () => ({ default: () => null }));
vi.mock('@lingui/core/macro', () => ({ t: (strings: TemplateStringsArray) => strings[0] }));
vi.mock('@lingui/react/macro', () => ({ Trans: ({ children }: { children?: ReactNode }) => children }));
vi.mock('@/components/DirectMessages/ContactAvatar.js', () => ({ ContactAvatar: () => null }));
vi.mock('@/components/DirectMessages/useDebouncedDmSearch.js', () => ({
    useDebouncedDmSearch: (value: string) => value,
}));
vi.mock('@/components/Modal.js', () => ({
    Modal: ({ children, open }: { children: ReactNode; open: boolean }) => (open ? children : null),
}));
vi.mock('@/components/ModalTitle.js', () => ({ ModalTitle: () => null }));
vi.mock('@/components/Popover.js', () => ({ Popover: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/hooks/useDirectMessages.js', () => ({
    useDmProfileSearch: (...args: unknown[]) => profileSearchMock(...args),
}));
vi.mock('@/hooks/useMediaQuery.js', () => ({ useIsMedium: () => true }));

const account = '0xCurrent';
const contacts: DirectMessageContact[] = [
    {
        id: 'self',
        targetUserId: ' 0xCURRENT ',
        name: 'Current user',
        handle: 'self',
        initials: 'CU',
    },
    {
        id: 'other',
        targetUserId: '0xOther',
        name: 'Other user',
        handle: 'other',
        initials: 'OU',
    },
];

afterEach(() => {
    cleanup();
    profileSearchMock.mockReset();
});

describe('NewMessageModal', () => {
    test('excludes the active account from recent contacts', () => {
        profileSearchMock.mockReturnValue({ data: undefined, isError: false, isFetching: false });

        render(
            createElement(NewMessageModal, {
                account,
                contacts,
                open: true,
                onClose: vi.fn(),
                onSelect: vi.fn(),
            }),
        );

        expect(screen.queryByText('Current user')).toBeNull();
        expect(screen.getByText('Other user')).toBeTruthy();
    });

    test('excludes the active account from profile search results', () => {
        profileSearchMock.mockReturnValue({
            data: [
                { id: '0xcurrent', handle: 'self', name: 'Current user', avatar: null },
                { id: '0xOther', handle: 'other', name: 'Other user', avatar: null },
            ],
            isError: false,
            isFetching: false,
        });

        render(
            createElement(NewMessageModal, {
                account,
                contacts,
                open: true,
                onClose: vi.fn(),
                onSelect: vi.fn(),
            }),
        );
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'user' } });

        expect(screen.queryByText('Current user')).toBeNull();
        expect(screen.getByText('Other user')).toBeTruthy();
    });
});
