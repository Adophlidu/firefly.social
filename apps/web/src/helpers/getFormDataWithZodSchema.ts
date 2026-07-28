import type { NextRequest } from '@/compat/next-server.js';
import type { ZodObject, ZodRawShape } from 'zod';

export async function getFormDataWithZodSchema<T extends ZodRawShape>(request: NextRequest, schema: ZodObject<T>) {
    const formData = await request.formData();
    return schema.parse(Object.fromEntries(formData.entries()));
}
