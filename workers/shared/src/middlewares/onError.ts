import type { Context } from 'hono';
import { ZodError } from 'zod';

import { RecognizableError } from '@/shared/src/constants/error.js';

export function onError(err: Error, c: Context) {
    if (err instanceof ZodError) {
        return c.json({ success: false, error: { code: 40001, message: err.message } }, 502);
    }
    if (err instanceof RecognizableError) {
        return c.json({ success: false, error: { code: 40001, message: err.message } }, 200);
    }
    return c.json({ success: false, error: { code: 40001, message: err.message } }, 502);
}
