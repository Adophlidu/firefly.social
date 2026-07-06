/// @vitest-environment jsdom
import { clearChunkReloadGuard, reloadOnceForChunkError } from '@dimensiondev/exception-tracker';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const GUARD_KEY = 'firefly:chunk-reload-attempted';

let reloadMock: ReturnType<typeof vi.fn>;
let originalLocation: Location;

beforeEach(() => {
    sessionStorage.clear();
    reloadMock = vi.fn();
    originalLocation = window.location;
    // jsdom's location.reload throws "Not implemented"; replace it with a spy.
    Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...originalLocation, reload: reloadMock },
    });
});

afterEach(() => {
    Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
    });
    sessionStorage.clear();
});

describe('reloadOnceForChunkError', () => {
    it('does nothing for a non-chunk error', () => {
        const result = reloadOnceForChunkError(new Error('boom'));

        expect(result).toBe(false);
        expect(reloadMock).not.toHaveBeenCalled();
        expect(sessionStorage.getItem(GUARD_KEY)).toBeNull();
    });

    it('sets the guard and reloads on the first chunk error', () => {
        const result = reloadOnceForChunkError(new Error('Loading chunk 42 failed'));

        expect(result).toBe(true);
        expect(reloadMock).toHaveBeenCalledTimes(1);
        expect(sessionStorage.getItem(GUARD_KEY)).toBe('1');
    });

    it('does not reload again when the guard is already set', () => {
        sessionStorage.setItem(GUARD_KEY, '1');

        const result = reloadOnceForChunkError(new Error('ChunkLoadError: Loading chunk 42 failed'));

        expect(result).toBe(false);
        expect(reloadMock).not.toHaveBeenCalled();
    });
});

describe('clearChunkReloadGuard', () => {
    it('removes the guard key', () => {
        sessionStorage.setItem(GUARD_KEY, '1');

        clearChunkReloadGuard();

        expect(sessionStorage.getItem(GUARD_KEY)).toBeNull();
    });
});
