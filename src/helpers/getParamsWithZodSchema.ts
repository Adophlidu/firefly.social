import { type ZodObject, type ZodRawShape } from 'zod';

import { type NextRequestContext } from '@/types/utility.js';

export async function getParamsWithZodSchema<T extends ZodRawShape>(
    schema: ZodObject<T>,
    context?: NextRequestContext,
) {
    const params = (await context?.params) ?? {};
    return schema.parse(params);
}
