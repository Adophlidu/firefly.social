import { NextRequest } from 'next/server.js';
import { describe, expect, test } from 'vitest';

import { handleDisabledRoutes } from '@/proxy/handlers/disabledRoutes.js';

describe('disabled routes handler', () => {
    test.each(['/messages', '/en/messages', '/perpetuals', '/zh-Hans/perpetuals'])(
        'allows enabled route %s to continue',
        (pathname) => {
            const response = handleDisabledRoutes(new NextRequest(`https://firefly.social${pathname}`));

            expect(response).toBeUndefined();
        },
    );

    test('allows enabled routes to continue', () => {
        const response = handleDisabledRoutes(new NextRequest('https://firefly.social/following/posts'));

        expect(response).toBeUndefined();
    });
});
