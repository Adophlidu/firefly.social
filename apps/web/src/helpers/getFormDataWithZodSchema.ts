import type { ZodObject, ZodRawShape } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';

export async function getFormDataWithZodSchema<T extends ZodRawShape>(request: NextRequest, schema: ZodObject<T>) {
    const formData = await request.formData();
    return schema.parse(Object.fromEntries(formData.entries()));
}
