import type { NextRequest } from 'next/server.js';

import { createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';

export async function GET(request: NextRequest) {
    return createSuccessResponseJSON({ message: 'OK' });
}
