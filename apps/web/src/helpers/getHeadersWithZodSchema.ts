import type { ZodObject, ZodRawShape } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';

export function getHeadersWithZodSchema<T extends ZodRawShape>(request: NextRequest, schema: ZodObject<T>) {
    const headers = Object.fromEntries(request.headers.entries());
    return schema.parse(headers);
}
