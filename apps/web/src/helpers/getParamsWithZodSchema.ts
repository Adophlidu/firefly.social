import type { NextRequestContext } from '@dimensiondev/types';
import type { ZodObject, ZodRawShape } from 'zod';

export async function getParamsWithZodSchema<T extends ZodRawShape>(
    schema: ZodObject<T>,
    context?: NextRequestContext,
) {
    const params = (await context?.params) ?? {};
    return schema.parse(params);
}
