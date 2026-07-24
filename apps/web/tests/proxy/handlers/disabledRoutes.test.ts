import { NextRequest } from 'next/server.js';
import { describe, expect, test } from 'vitest';

import { handleDisabledRoutes } from '@/proxy/handlers/disabledRoutes.js';

describe('disabled routes handler', () => {
    test.each(['/messages', '/en/messages', '/perpetuals', '/zh-Hans/perpetuals'])('returns 404 for %s', (pathname) => {
        const response = handleDisabledRoutes(new NextRequest(`https://firefly.social${pathname}`));

        expect(response?.status).toBe(404);
    });

    test('allows enabled routes to continue', () => {
        const response = handleDisabledRoutes(new NextRequest('https://firefly.social/following/posts'));

        expect(response).toBeUndefined();
    });
});
