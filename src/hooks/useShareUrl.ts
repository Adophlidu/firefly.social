import { useMemo } from 'react';

import { addSharerParam } from '@/helpers/addSharerParam.js';
import { useCurrentFireflyAccountUID } from '@/hooks/useCurrentFireflyAccountUID.js';

/**
 * Automatically add current user's sharer parameter to a URL
 * @param baseUrl - Base URL
 * @returns URL with sharer parameter added (if user is logged in)
 */
export function useShareUrl(baseUrl: string): string {
    const fireflyUid = useCurrentFireflyAccountUID();
    return useMemo(() => addSharerParam(baseUrl, fireflyUid), [baseUrl, fireflyUid]);
}
