import type { NextRequest } from 'next/server.js';
import type { ZodObject, ZodRawShape } from 'zod';

/**
 * Works with both Next's NextRequest (`request.nextUrl`) and the standard
 * fetch Request used by the SSR library's API routes.
 */
export function getSearchParamsWithZodSchema<T extends ZodRawShape>(request: NextRequest, schema: ZodObject<T>) {
    const nextUrl = (request as NextRequest & { nextUrl?: { searchParams: URLSearchParams } }).nextUrl;
    const searchParams = nextUrl?.searchParams ?? new URL(request.url).searchParams;
    return schema.parse(Object.fromEntries(searchParams.entries()));
}
