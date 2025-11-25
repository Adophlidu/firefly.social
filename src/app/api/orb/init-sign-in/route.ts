import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';

import { ORB_API_URL } from '@/constants/index.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import type { SignInResponse } from '@/providers/orb/type.js';

export async function GET(request: NextRequest) {
    const url = urlcat(ORB_API_URL, '/init-sign-in');
    const response = await fetchOrbJson<SignInResponse>(url);
    return createResponseJsonFromOrb(response, 'Failed to init sign in orb');
}
