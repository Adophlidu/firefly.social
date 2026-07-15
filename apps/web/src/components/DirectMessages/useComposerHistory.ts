import { useCallback, useRef, useState } from 'react';

// Cap how far back undo can go so a long editing session cannot grow the snapshot stack unbounded.
const MAX_HISTORY = 100;
// Consecutive text edits within this window collapse into a single undo step, so undo rewinds a
// burst of typing rather than one character at a time.
const TEXT_COALESCE_MS = 500;

interface History<T> {
    past: T[];
    present: T;
    future: T[];
}

type Updater<T> = T | ((prev: T) => T);

function resolve<T>(next: Updater<T>, prev: T): T {
    return typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
}

export interface ComposerHistory<T> {
    state: T;
    canUndo: boolean;
    canRedo: boolean;
    // A discrete change that becomes its own undo step (add/remove attachment, insert emoji).
    commit: (next: Updater<T>) => void;
    // Commit using an explicit baseline as the undo target rather than the current present. Used for
    // IME input, where intermediate composition states updated the present in place but the undo
    // step should return to the pre-composition state, not the half-typed pinyin.
    commitFrom: (baseline: T, next: Updater<T>) => void;
    // An in-place update that does not create an undo step (async metadata backfill, IME composition).
    replace: (next: Updater<T>) => void;
    // A text edit; consecutive text edits within TEXT_COALESCE_MS fold into one undo step.
    editText: (next: Updater<T>) => void;
    undo: () => void;
    redo: () => void;
    // A fresh baseline that clears the history (e.g. after a message is sent).
    reset: (next: T) => void;
}

// Snapshot-based undo/redo for the composer: every edit produces an immutable snapshot of the whole
// editable state, so a new message type is covered automatically once its data lives in that state.
export function useComposerHistory<T>(initial: T): ComposerHistory<T> {
    const [history, setHistory] = useState<History<T>>({ past: [], present: initial, future: [] });
    const coalesceRef = useRef<{ isText: boolean; at: number }>({ isText: false, at: 0 });

    const pushCheckpoint = useCallback((next: Updater<T>) => {
        setHistory((current) => ({
            past: [...current.past, current.present].slice(-MAX_HISTORY),
            present: resolve(next, current.present),
            future: [],
        }));
    }, []);

    const replace = useCallback((next: Updater<T>) => {
        setHistory((current) => ({ ...current, present: resolve(next, current.present) }));
    }, []);

    const commit = useCallback(
        (next: Updater<T>) => {
            coalesceRef.current.isText = false;
            pushCheckpoint(next);
        },
        [pushCheckpoint],
    );

    const commitFrom = useCallback((baseline: T, next: Updater<T>) => {
        coalesceRef.current.isText = false;
        setHistory((current) => ({
            past: [...current.past, baseline].slice(-MAX_HISTORY),
            present: resolve(next, current.present),
            future: [],
        }));
    }, []);

    const editText = useCallback(
        (next: Updater<T>) => {
            const now = Date.now();
            const previous = coalesceRef.current;
            const shouldCoalesce = previous.isText && now - previous.at < TEXT_COALESCE_MS;
            coalesceRef.current = { isText: true, at: now };
            if (shouldCoalesce) replace(next);
            else pushCheckpoint(next);
        },
        [pushCheckpoint, replace],
    );

    const undo = useCallback(() => {
        coalesceRef.current.isText = false;
        setHistory((current) => {
            if (!current.past.length) return current;
            const previous = current.past[current.past.length - 1];
            return {
                past: current.past.slice(0, -1),
                present: previous,
                future: [current.present, ...current.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        coalesceRef.current.isText = false;
        setHistory((current) => {
            if (!current.future.length) return current;
            const [next, ...rest] = current.future;
            return { past: [...current.past, current.present], present: next, future: rest };
        });
    }, []);

    const reset = useCallback((next: T) => {
        coalesceRef.current = { isText: false, at: 0 };
        setHistory({ past: [], present: next, future: [] });
    }, []);

    return {
        state: history.present,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        commit,
        commitFrom,
        replace,
        editText,
        undo,
        redo,
        reset,
    };
}
