import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { ORBSignInResponseData } from '@/providers/orb/type.js';
import type { ResponseJson } from '@/types/utility.js';

export async function initSignIn() {
    const response = await fetchJson<ResponseJson<ORBSignInResponseData>>('/api/orb/init-sign-in');
    const data = resolveResponseData(response, 'Failed to init sign in orb');
    return data;
}
