/// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { useStartDmChat } from '@/hooks/useDirectMessages.js';
import type { ChatChannel } from '@/providers/orb/chat/types.js';

const { resolveDmChannelMock } = vi.hoisted(() => ({ resolveDmChannelMock: vi.fn() }));

vi.mock('@/providers/orb/chat/resolveDmChannel.js', () => ({
    resolveDmChannel: (...args: unknown[]) => resolveDmChannelMock(...args),
}));

afterEach(() => {
    cleanup();
    resolveDmChannelMock.mockReset();
});

describe('useStartDmChat', () => {
    test('resolves the channel through the shared DM resolver', async () => {
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const wrapper = ({ children }: { children: ReactNode }) =>
            createElement(QueryClientProvider, { client: queryClient }, children);
        const channel = { id: 'channel-1' } as ChatChannel;
        resolveDmChannelMock.mockResolvedValue(channel);

        const { result } = renderHook(() => useStartDmChat('0x1234'), { wrapper });
        await act(async () => {
            await expect(result.current.mutateAsync('0xabcd')).resolves.toBe(channel);
        });

        expect(resolveDmChannelMock).toHaveBeenCalledWith('0x1234', '0xabcd');
    });
});
