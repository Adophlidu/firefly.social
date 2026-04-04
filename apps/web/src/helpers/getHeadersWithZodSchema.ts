import { type NextRequest } from 'next/server.js';
import { type ZodObject, type ZodRawShape } from 'zod';

export function getHeadersWithZodSchema<T extends ZodRawShape>(request: NextRequest, schema: ZodObject<T>) {
    const headers = Object.fromEntries(request.headers.entries());
    return schema.parse(headers);
}
