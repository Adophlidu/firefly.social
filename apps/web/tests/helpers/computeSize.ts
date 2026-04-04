import { describe, expect, test } from 'vitest';

import { computeSize } from '@/helpers/computeSize.js';

describe('computeSize', () => {
    test.each([
        [100, 100, { minWidth: 50, minHeight: 50, maxWidth: 200, maxHeight: 200 }, [100, 100]],
        [30, 30, { minWidth: 50, minHeight: 50, maxWidth: 200, maxHeight: 200 }, [50, 50]],
        [250, 250, { minWidth: 50, minHeight: 50, maxWidth: 200, maxHeight: 200 }, [200, 200]],
        [150, 75, { minWidth: 50, minHeight: 50, maxWidth: 200, maxHeight: 200 }, [150, 75]],
        [300, 150, { minWidth: 50, minHeight: 50, maxWidth: 200, maxHeight: 200 }, [200, 100]],
        [1000, 500, { minWidth: 50, minHeight: 50, maxWidth: 200, maxHeight: 200 }, [200, 100]],
        [100, 400, { minWidth: 50, minHeight: 50, maxWidth: 200, maxHeight: 200 }, [50, 200]],
        [4000, 2000, { minWidth: 50, minHeight: 50, maxWidth: 200, maxHeight: 200 }, [200, 100]],
    ])('computeSize(%d, %d) with options %o', (width, height, options, expected) => {
        expect(computeSize(width, height, options)).toEqual(expected);
    });
});
