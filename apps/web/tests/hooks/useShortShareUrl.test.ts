/// @vitest-environment jsdom
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FetchError } from '@/constants/error.js';
import { useShortShareUrl } from '@/hooks/useShortShareUrl.js';
import { createShortlink } from '@/providers/firefly/endpoint/createShortlink.js';

vi.mock('@/providers/firefly/endpoint/createShortlink.js', () => ({
    createShortlink: vi.fn(),
}));

const createShortlinkMock = vi.mocked(createShortlink);

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

const LENS_LINK =
    'https://firefly.social/post/lens/75465786495708041024031980789350935549587309036456321130993194581442600477851?sid=2296550846';
const LENS_SHORT_URL = 'https://firefly.social/i/AbCdEfGhIjKl';

beforeEach(() => {
    createShortlinkMock.mockReset();
});

afterEach(() => {
    envs.external.NEXT_PUBLIC_SHORT_LINK = STATUS.Enabled;
});

describe('useShortShareUrl', () => {
    it('falls back to the input URL before register() resolves', () => {
        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });
        expect(result.current.url).toBe(LENS_LINK);
        expect(result.current.isPending).toBe(false);
        expect(createShortlinkMock).not.toHaveBeenCalled();
    });

    it('register() creates the short link on the backend and resolves to it', async () => {
        createShortlinkMock.mockResolvedValue({ code: 'AbCdEfGhIjKl', shortlink: LENS_SHORT_URL });
        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });

        let resolved: string | undefined;
        await act(async () => {
            resolved = await result.current.register();
        });

        expect(resolved).toBe(LENS_SHORT_URL);
        expect(createShortlinkMock).toHaveBeenCalledWith(LENS_LINK);
        // The reactive `url`/`isPending` catch up on the next render, once react-query's
        // own mutation-success notification lands — register()'s resolved value above is
        // already correct and doesn't wait on this.
        await waitFor(() => expect(result.current.url).toBe(LENS_SHORT_URL));
        expect(result.current.isPending).toBe(false);
    });

    it('isPending is true while the create call is in flight', async () => {
        let resolveCreate!: (value: { code: string; shortlink: string }) => void;
        createShortlinkMock.mockReturnValue(
            new Promise((resolve) => {
                resolveCreate = resolve;
            }),
        );
        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });

        act(() => {
            void result.current.register();
        });
        await waitFor(() => expect(result.current.isPending).toBe(true));

        await act(async () => {
            resolveCreate({ code: 'AbCdEfGhIjKl', shortlink: LENS_SHORT_URL });
            await Promise.resolve();
        });
        await waitFor(() => expect(result.current.isPending).toBe(false));
    });

    it('register() reuses the created link instead of registering again', async () => {
        createShortlinkMock.mockResolvedValue({ code: 'AbCdEfGhIjKl', shortlink: LENS_SHORT_URL });
        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.register();
        });
        await act(async () => {
            await result.current.register();
        });

        expect(createShortlinkMock).toHaveBeenCalledTimes(1);
    });

    it('register() is a no-op for unsupported links', async () => {
        const { result } = renderHook(() => useShortShareUrl('https://firefly.social/explore'), {
            wrapper: createWrapper(),
        });

        let resolved: string | undefined;
        await act(async () => {
            resolved = await result.current.register();
        });

        expect(resolved).toBe('https://firefly.social/explore');
        expect(createShortlinkMock).not.toHaveBeenCalled();
    });

    it('register() is a no-op for an empty URL', async () => {
        const { result } = renderHook(() => useShortShareUrl(''), { wrapper: createWrapper() });
        await act(async () => {
            await result.current.register();
        });
        expect(createShortlinkMock).not.toHaveBeenCalled();
    });

    it('register() falls back to the input URL when the create call fails', async () => {
        createShortlinkMock.mockRejectedValue(new Error('backend unavailable'));
        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });

        let resolved: string | undefined;
        await act(async () => {
            resolved = await result.current.register();
        });

        expect(resolved).toBe(LENS_LINK);
        expect(result.current.url).toBe(LENS_LINK);
    });

    it('register() retries a transient 5xx and resolves to the short link once it recovers', async () => {
        createShortlinkMock
            .mockRejectedValueOnce(new FetchError('server error', LENS_LINK, 503, 'Service Unavailable', ''))
            .mockResolvedValueOnce({ code: 'AbCdEfGhIjKl', shortlink: LENS_SHORT_URL });
        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });

        let resolved: string | undefined;
        await act(async () => {
            resolved = await result.current.register();
        });

        expect(resolved).toBe(LENS_SHORT_URL);
        expect(createShortlinkMock).toHaveBeenCalledTimes(2);
    });

    it('register() does not retry a 401 and falls back to the input URL immediately', async () => {
        createShortlinkMock.mockRejectedValue(new FetchError('unauthorized', LENS_LINK, 401, 'Unauthorized', ''));
        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });

        let resolved: string | undefined;
        await act(async () => {
            resolved = await result.current.register();
        });

        expect(resolved).toBe(LENS_LINK);
        expect(createShortlinkMock).toHaveBeenCalledTimes(1);
    });

    it('falls back to the input URL and never registers when NEXT_PUBLIC_SHORT_LINK is disabled', async () => {
        envs.external.NEXT_PUBLIC_SHORT_LINK = STATUS.Disabled;

        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });
        expect(result.current.url).toBe(LENS_LINK);

        await act(async () => {
            await result.current.register();
        });
        expect(createShortlinkMock).not.toHaveBeenCalled();
    });
});
