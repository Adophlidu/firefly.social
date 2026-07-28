/// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
vi.mock('@/components/LoadingIcon.js', () => ({ LoadingIcon: () => null }));
vi.mock('@/components/ModalTitle.js', () => ({ ModalTitle: () => null }));
vi.mock('@/components/Popover.js', () => ({ Popover: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/components/VirtualList/VirtualList.js', () => ({
    VirtualList: ({
        atBottomStateChange,
        data,
        itemContent,
    }: {
        atBottomStateChange?: (isAtBottom: boolean) => void;
        data: DirectMessageContact[];
        itemContent: (index: number, contact: DirectMessageContact) => ReactNode;
    }) =>
        createElement(
            'div',
            null,
            ...data.map((contact, index) => createElement('div', { key: contact.id }, itemContent(index, contact))),
            createElement('button', { type: 'button', onClick: () => atBottomStateChange?.(true) }, 'End reached'),
        ),
}));
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

    test('loads the next profile search page when the virtual list reaches the end', async () => {
        const profiles = [{ id: '0xOther', handle: 'other', name: 'Other user', avatar: null }];
        const fetchNextPage = vi.fn().mockResolvedValue({ data: profiles, hasNextPage: false });
        profileSearchMock.mockReturnValue({
            data: profiles,
            fetchNextPage,
            hasNextPage: true,
            isError: false,
            isFetching: false,
            isFetchingNextPage: false,
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
        fireEvent.click(screen.getByRole('button', { name: 'End reached' }));

        await waitFor(() => expect(fetchNextPage).toHaveBeenCalledOnce());
    });

    test('skips pages that contain only duplicate profiles', async () => {
        const profiles = [{ id: '0xOther', handle: 'other', name: 'Other user', avatar: null }];
        const nextProfiles = [...profiles, { id: '0xNext', handle: 'next', name: 'Next user', avatar: null }];
        const fetchNextPage = vi
            .fn()
            .mockResolvedValueOnce({ data: profiles, hasNextPage: true })
            .mockResolvedValueOnce({ data: nextProfiles, hasNextPage: true });
        profileSearchMock.mockReturnValue({
            data: profiles,
            fetchNextPage,
            hasNextPage: true,
            isError: false,
            isFetching: false,
            isFetchingNextPage: false,
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
        fireEvent.click(screen.getByRole('button', { name: 'End reached' }));

        await waitFor(() => expect(fetchNextPage).toHaveBeenCalledTimes(2));
    });

    test('tracks loaded profiles across consecutive end events', async () => {
        const profiles = [{ id: '0xOther', handle: 'other', name: 'Other user', avatar: null }];
        const secondPageProfiles = [
            ...profiles,
            { id: '0xSecond', handle: 'second', name: 'Second user', avatar: null },
        ];
        const thirdPageProfiles = [
            ...secondPageProfiles,
            { id: '0xThird', handle: 'third', name: 'Third user', avatar: null },
        ];
        const fetchNextPage = vi
            .fn()
            .mockResolvedValueOnce({ data: secondPageProfiles, hasNextPage: true })
            .mockResolvedValueOnce({ data: secondPageProfiles, hasNextPage: true })
            .mockResolvedValueOnce({ data: thirdPageProfiles, hasNextPage: true });
        profileSearchMock.mockReturnValue({
            data: profiles,
            fetchNextPage,
            hasNextPage: true,
            isError: false,
            isFetching: false,
            isFetchingNextPage: false,
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
        fireEvent.click(screen.getByRole('button', { name: 'End reached' }));
        await waitFor(() => expect(fetchNextPage).toHaveBeenCalledOnce());

        fireEvent.click(screen.getByRole('button', { name: 'End reached' }));

        await waitFor(() => expect(fetchNextPage).toHaveBeenCalledTimes(3));
    });

    test('queues an end event received while a page is loading', async () => {
        const profiles = [{ id: '0xOther', handle: 'other', name: 'Other user', avatar: null }];
        const nextProfiles = [...profiles, { id: '0xNext', handle: 'next', name: 'Next user', avatar: null }];
        let resolveFirstPage: (value: { data: typeof nextProfiles; hasNextPage: boolean }) => void;
        const firstPage = new Promise<{ data: typeof nextProfiles; hasNextPage: boolean }>((resolve) => {
            resolveFirstPage = resolve;
        });
        const fetchNextPage = vi
            .fn()
            .mockReturnValueOnce(firstPage)
            .mockResolvedValueOnce({ data: nextProfiles, hasNextPage: false });
        profileSearchMock.mockReturnValue({
            data: profiles,
            fetchNextPage,
            hasNextPage: true,
            isError: false,
            isFetching: false,
            isFetchingNextPage: false,
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
        fireEvent.click(screen.getByRole('button', { name: 'End reached' }));
        fireEvent.click(screen.getByRole('button', { name: 'End reached' }));
        expect(fetchNextPage).toHaveBeenCalledOnce();

        await act(async () => {
            resolveFirstPage({ data: nextProfiles, hasNextPage: true });
        });

        await waitFor(() => expect(fetchNextPage).toHaveBeenCalledTimes(2));
    });
});
