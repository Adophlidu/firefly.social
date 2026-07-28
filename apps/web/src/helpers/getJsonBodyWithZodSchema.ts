import type { NextRequest } from '@/compat/next-server.js';
import type { ZodObject, ZodRawShape } from 'zod';

export async function getJsonBodyWithZodSchema<T extends ZodRawShape>(request: NextRequest, schema: ZodObject<T>) {
    const body = await request.json();
    return schema.parse(body);
}
