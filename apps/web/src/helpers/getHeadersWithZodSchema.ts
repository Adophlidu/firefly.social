import type { NextRequest } from '@/compat/next-server.js';
import type { ZodObject, ZodRawShape } from 'zod';

export function getHeadersWithZodSchema<T extends ZodRawShape>(request: NextRequest, schema: ZodObject<T>) {
    const headers = Object.fromEntries(request.headers.entries());
    return schema.parse(headers);
}
