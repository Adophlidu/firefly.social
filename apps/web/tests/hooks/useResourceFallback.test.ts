/// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { reportResourceFailure } from '@/helpers/resourceFailureTracker.js';
import { useResourceFallback } from '@/hooks/useResourceFallback.js';

describe('useResourceFallback', () => {
    it('starts at the first candidate', () => {
        const { result } = renderHook(() => useResourceFallback(['https://a.test/1.png', 'https://a.test/2.png']));
        expect(result.current.src).toBe('https://a.test/1.png');
        expect(result.current.failed).toBe(false);
    });

    it('drops falsy and duplicate candidates', () => {
        const { result } = renderHook(() =>
            useResourceFallback([undefined, 'https://dup.test/1.png', 'https://dup.test/1.png']),
        );
        expect(result.current.src).toBe('https://dup.test/1.png');
    });

    it('advances on error, then fails once the chain is exhausted', () => {
        const { result } = renderHook(() => useResourceFallback(['https://b.test/1.png', 'https://b.test/2.png']));
        act(() => result.current.onError());
        expect(result.current.src).toBe('https://b.test/2.png');

        act(() => result.current.onError());
        expect(result.current.src).toBeUndefined();
        expect(result.current.failed).toBe(true);
    });

    it('skips a candidate whose host is flooding', () => {
        for (let i = 0; i < 5; i += 1) reportResourceFailure(`https://flood.test/${i}.png`);
        const { result } = renderHook(() =>
            useResourceFallback(['https://flood.test/banner.png', 'https://safe.test/ok.png']),
        );
        expect(result.current.src).toBe('https://safe.test/ok.png');
    });

    it('resets the cursor when the candidate list changes', () => {
        const { result, rerender } = renderHook(({ list }) => useResourceFallback(list), {
            initialProps: { list: ['https://c.test/1.png', 'https://c.test/2.png'] as Array<string | undefined> },
        });
        act(() => result.current.onError());
        expect(result.current.src).toBe('https://c.test/2.png');

        rerender({ list: ['https://d.test/1.png', 'https://d.test/2.png'] });
        expect(result.current.src).toBe('https://d.test/1.png');
    });
});
