/// @vitest-environment jsdom
// cspell:ignore nihao pinyin

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useComposerHistory } from '@/components/DirectMessages/useComposerHistory.js';

describe('useComposerHistory', () => {
    it('commits discrete changes as separate undo steps', () => {
        const { result } = renderHook(() => useComposerHistory({ value: 0 }));

        act(() => result.current.commit({ value: 1 }));
        act(() => result.current.commit({ value: 2 }));
        expect(result.current.state).toEqual({ value: 2 });

        act(() => result.current.undo());
        expect(result.current.state).toEqual({ value: 1 });
        act(() => result.current.undo());
        expect(result.current.state).toEqual({ value: 0 });
        expect(result.current.canUndo).toBe(false);
    });

    it('redoes an undone change', () => {
        const { result } = renderHook(() => useComposerHistory({ value: 0 }));

        act(() => result.current.commit({ value: 1 }));
        act(() => result.current.undo());
        expect(result.current.canRedo).toBe(true);

        act(() => result.current.redo());
        expect(result.current.state).toEqual({ value: 1 });
    });

    it('coalesces consecutive text edits into a single undo step', () => {
        const { result } = renderHook(() => useComposerHistory({ text: '' }));

        act(() => result.current.editText({ text: 'h' }));
        act(() => result.current.editText({ text: 'he' }));
        act(() => result.current.editText({ text: 'hel' }));
        expect(result.current.state).toEqual({ text: 'hel' });

        // One undo rewinds the whole typing burst back to the baseline.
        act(() => result.current.undo());
        expect(result.current.state).toEqual({ text: '' });
    });

    it('replace updates in place without creating an undo step', () => {
        const { result } = renderHook(() => useComposerHistory({ value: 0, meta: '' }));

        act(() => result.current.commit({ value: 1, meta: '' }));
        act(() => result.current.replace({ value: 1, meta: 'loaded' }));
        expect(result.current.state).toEqual({ value: 1, meta: 'loaded' });

        // Undo skips the in-place replace and returns to the pre-commit baseline.
        act(() => result.current.undo());
        expect(result.current.state).toEqual({ value: 0, meta: '' });
    });

    it('a new commit after undo clears the redo stack', () => {
        const { result } = renderHook(() => useComposerHistory({ value: 0 }));

        act(() => result.current.commit({ value: 1 }));
        act(() => result.current.undo());
        expect(result.current.canRedo).toBe(true);

        act(() => result.current.commit({ value: 5 }));
        expect(result.current.canRedo).toBe(false);
        expect(result.current.state).toEqual({ value: 5 });
    });

    it('commitFrom targets an explicit baseline, ignoring in-place edits made since', () => {
        const { result } = renderHook(() => useComposerHistory({ text: '' }));

        // Simulate an IME composition: capture the baseline, then update in place (pinyin).
        const baseline = result.current.state;
        act(() => result.current.replace({ text: 'ni' }));
        act(() => result.current.replace({ text: 'nihao' }));
        // Commit the finished word against the pre-composition baseline.
        act(() => result.current.commitFrom(baseline, { text: '你好' }));
        expect(result.current.state).toEqual({ text: '你好' });

        // One undo returns to the pre-composition state, never the intermediate pinyin.
        act(() => result.current.undo());
        expect(result.current.state).toEqual({ text: '' });
    });

    it('reset clears the history', () => {
        const { result } = renderHook(() => useComposerHistory({ value: 0 }));

        act(() => result.current.commit({ value: 1 }));
        act(() => result.current.reset({ value: 9 }));
        expect(result.current.state).toEqual({ value: 9 });
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
    });
});
