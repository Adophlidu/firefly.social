import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLatestRafThrottle } from '../../../../packages/rn-ui/src/helpers/rafThrottleLatest.js';

describe('createLatestRafThrottle', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('flushes the latest value once per frame', async () => {
        const flushed: number[] = [];
        const rafCallbacks: FrameRequestCallback[] = [];

        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            rafCallbacks.push(cb);
            return rafCallbacks.length;
        });
        vi.stubGlobal('cancelAnimationFrame', vi.fn());

        const throttle = createLatestRafThrottle<number>((v) => {
            flushed.push(v);
        });

        throttle.schedule(1);
        throttle.schedule(2);
        throttle.schedule(3);
        expect(flushed).toEqual([]);

        expect(rafCallbacks.length).toBe(1);
        rafCallbacks[0]!(0);
        expect(flushed).toEqual([3]);

        throttle.schedule(4);
        expect(rafCallbacks.length).toBe(2);
        rafCallbacks[1]!(0);
        expect(flushed).toEqual([3, 4]);

        throttle.dispose();
    });

    it('dispose cancels the scheduled frame and drops pending work', () => {
        const flushed: number[] = [];
        const rafCallbacks: FrameRequestCallback[] = [];
        const cancelAnimationFrame = vi.fn();

        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            rafCallbacks.push(cb);
            return 42;
        });
        vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

        const throttle = createLatestRafThrottle<number>((v) => flushed.push(v));
        throttle.schedule(1);
        throttle.dispose();
        expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
        expect(flushed).toEqual([]);
    });
});
