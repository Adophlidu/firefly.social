import type { ZodObject, ZodRawShape } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';

export async function getJsonBodyWithZodSchema<T extends ZodRawShape>(request: NextRequest, schema: ZodObject<T>) {
    const body = await request.json();
    return schema.parse(body);
}
