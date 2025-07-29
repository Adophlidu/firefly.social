import type { NextRequest } from 'next/server.js';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';

export async function GET(request: NextRequest) {
    return createSuccessResponseJson({ message: 'OK' });
}
