import { type NextRequest } from 'next/server.js';
import { type ZodObject, type ZodRawShape } from 'zod';

export function getSearchParamsWithZodSchema<T extends ZodRawShape>(request: NextRequest, schema: ZodObject<T>) {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    return schema.parse(searchParams);
}
