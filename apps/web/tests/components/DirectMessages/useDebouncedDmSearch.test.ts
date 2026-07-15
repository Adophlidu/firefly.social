/// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { useDebouncedDmSearch } from '@/components/DirectMessages/useDebouncedDmSearch.js';

afterEach(() => {
    vi.useRealTimers();
});

describe('useDebouncedDmSearch', () => {
    test('publishes only the final value after 300 milliseconds', () => {
        vi.useFakeTimers();
        const { result, rerender } = renderHook(({ value }) => useDebouncedDmSearch(value), {
            initialProps: { value: '' },
        });

        rerender({ value: 'a' });
        rerender({ value: 'al' });
        rerender({ value: 'alice' });

        act(() => vi.advanceTimersByTime(299));
        expect(result.current).toBe('');

        act(() => vi.advanceTimersByTime(1));
        expect(result.current).toBe('alice');
    });
});
