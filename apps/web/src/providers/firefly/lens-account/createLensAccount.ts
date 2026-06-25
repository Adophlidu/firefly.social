import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { CreateLensAccountV2Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface CreateLensAccountOptions {
    /** Display name for the Lens account metadata (required by the backend). */
    name: string;
    /** Bio for the Lens account metadata. */
    bio?: string;
    /** Avatar URL for the Lens account metadata. */
    avatar?: string;
}

/**
 * Ask the backend to create a Lens account for the current Firefly account and
 * bind it on the server. The backend selects the Privy EVM wallet, generates the
 * Lens username/handle, deploys the Lens account, and is idempotent (it returns
 * an "already created" error when a Lens account is already bound).
 */
export async function createLensAccount(options: CreateLensAccountOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/lens_account/create');
    return fireflySessionHolder.fetch<CreateLensAccountV2Response>(url, {
        method: 'POST',
        body: JSON.stringify({
            name: options.name,
            bio: options.bio,
            avatar: options.avatar,
        }),
    });
}
