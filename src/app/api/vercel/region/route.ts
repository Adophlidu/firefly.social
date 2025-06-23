import { createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';

export function GET(request: Request) {
    return createSuccessResponseJSON({
        'real-ip': request.headers.get('x-real-ip'),
        'vercel-ip-timezone': request.headers.get('x-vercel-ip-timezone'),
        'vercel-ip-city': request.headers.get('x-vercel-ip-city'),
        'vercel-ip-country': request.headers.get('x-vercel-ip-country'),
        'vercel-ip-region': request.headers.get('x-vercel-ip-country-region'),
    });
}
