/// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { useStartDmChat } from '@/hooks/useDirectMessages.js';
import type * as OrbChatApi from '@/providers/orb/chat/api.js';

const { createChatMock, getChatChannelMock } = vi.hoisted(() => ({
    createChatMock: vi.fn(),
    getChatChannelMock: vi.fn(),
}));

vi.mock('@/providers/orb/chat/api.js', async (importOriginal) => ({
    ...(await importOriginal<typeof OrbChatApi>()),
    createChat: (...args: unknown[]) => createChatMock(...args),
    getChatChannel: (...args: unknown[]) => getChatChannelMock(...args),
}));

afterEach(() => {
    cleanup();
    createChatMock.mockReset();
    getChatChannelMock.mockReset();
});

describe('useStartDmChat', () => {
    test('rejects when the newly created channel cannot be loaded', async () => {
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const wrapper = ({ children }: { children: ReactNode }) =>
            createElement(QueryClientProvider, { client: queryClient }, children);
        createChatMock.mockResolvedValue('channel-1');
        getChatChannelMock.mockResolvedValue(null);

        const { result } = renderHook(() => useStartDmChat('0x1234'), { wrapper });
        await act(async () => {
            await expect(result.current.mutateAsync('0xabcd')).rejects.toMatchObject({
                name: 'ChatApiError',
                route: 'get-chat-channel',
            });
        });

        expect(createChatMock).toHaveBeenCalledWith('0x1234', '0xabcd');
        expect(getChatChannelMock).toHaveBeenCalledWith('0x1234', 'channel-1');
    });
});
