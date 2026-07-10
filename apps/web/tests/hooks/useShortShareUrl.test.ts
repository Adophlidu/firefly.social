/// @vitest-environment jsdom
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerShortLink } from '@/actions/registerShortLink.js';
import { useShortShareUrl } from '@/hooks/useShortShareUrl.js';

vi.mock('@/actions/registerShortLink.js', () => ({
    registerShortLink: vi.fn(),
}));

const registerShortLinkMock = vi.mocked(registerShortLink);

function createWrapper() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

const LENS_LINK =
    'https://firefly.social/post/lens/75465786495708041024031980789350935549587309036456321130993194581442600477851?sid=2296550846';
const LENS_SHORT_URL = 'https://firefly.social/i/jBXQNDxHpn';

beforeEach(() => {
    registerShortLinkMock.mockReset();
});

afterEach(() => {
    envs.external.NEXT_PUBLIC_SHORT_LINK = STATUS.Enabled;
});

describe('useShortShareUrl', () => {
    it('computes the short link on the client without calling registerShortLink', async () => {
        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.url).toBe(LENS_SHORT_URL));
        expect(registerShortLinkMock).not.toHaveBeenCalled();
    });

    it('falls back to the input URL before the hash resolves', () => {
        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });
        expect(result.current.url).toBe(LENS_LINK);
    });

    it('falls back to the input URL for unsupported links', () => {
        const { result } = renderHook(() => useShortShareUrl('https://firefly.social/explore'), {
            wrapper: createWrapper(),
        });
        expect(result.current.url).toBe('https://firefly.social/explore');
    });

    it('register() calls registerShortLink for a supported link', () => {
        registerShortLinkMock.mockResolvedValue(LENS_SHORT_URL);
        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });

        result.current.register();

        expect(registerShortLinkMock).toHaveBeenCalledWith(LENS_LINK);
        expect(registerShortLinkMock).toHaveBeenCalledTimes(1);
    });

    it('register() is a no-op for unsupported links', () => {
        const { result } = renderHook(() => useShortShareUrl('https://firefly.social/explore'), {
            wrapper: createWrapper(),
        });

        result.current.register();

        expect(registerShortLinkMock).not.toHaveBeenCalled();
    });

    it('register() is a no-op for an empty URL', () => {
        const { result } = renderHook(() => useShortShareUrl(''), { wrapper: createWrapper() });
        result.current.register();
        expect(registerShortLinkMock).not.toHaveBeenCalled();
    });

    it('register() swallows errors silently without blocking the caller', async () => {
        registerShortLinkMock.mockRejectedValue(new Error('redis unavailable'));
        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });

        expect(() => result.current.register()).not.toThrow();
        await waitFor(() => expect(registerShortLinkMock).toHaveBeenCalled());
    });

    it('falls back to the input URL and never registers when NEXT_PUBLIC_SHORT_LINK is disabled', () => {
        envs.external.NEXT_PUBLIC_SHORT_LINK = STATUS.Disabled;

        const { result } = renderHook(() => useShortShareUrl(LENS_LINK), { wrapper: createWrapper() });
        expect(result.current.url).toBe(LENS_LINK);

        result.current.register();
        expect(registerShortLinkMock).not.toHaveBeenCalled();
    });
});
