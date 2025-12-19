import { bom, parseJson } from '@dimensiondev/utils';
import z from 'zod';

import { AsyncStatus, type SocialSource } from '@/constants/enum.js';
import { resolveProfileStorageKey } from '@/helpers/resolveProfileStorageKey.js';
import { logger } from '@/libs/Logger.js';

const Schema = z.object({
    state: z.object({
        status: z.union([z.literal(AsyncStatus.Idle), z.literal(AsyncStatus.Pending)]),
    }),
});

export function getProfileStoreStatusFromStorage(source: SocialSource) {
    const state = bom.localStorage?.getItem(resolveProfileStorageKey(source));
    if (!state) return null;

    const parsed = Schema.safeParse(parseJson(state));
    if (!parsed.success) {
        logger.error('Failed to parse profile store status from storage', parsed.error);
        return null;
    }

    return parsed.data.state.status;
}
