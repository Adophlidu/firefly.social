import type { SignInOptions } from '@farcaster/miniapp-host';

import { SITE_URL } from '@/constants/index.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { RelayConfirmationPopoverRef } from '@/modals/FrameViewerModal/controls.js';
import type { FrameV2 } from '@/types/frame.js';

/**
 * Learn more about auth address implementation:
 * https://warpcast.notion.site/Public-Auth-Addresses-Implementation-1f36a6c0c101806ea4ffd45f3343113e
 * https://warpcast.notion.site/Public-Auth-Address-Implementation-Guide-1fc6a6c0c10180a9b2a7f24c71143eae
 * @param frame
 * @param options
 * @returns
 */
export async function signInWithRelay(frame: FrameV2, options: SignInOptions) {
    const url = frame.x_url || SITE_URL;

    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const signed = await RelayConfirmationPopoverRef.openAndWaitForClose({
        siweUri: url,
        nonce: options.nonce,
        domain: u.hostname,
        acceptAuthAddress: options.acceptAuthAddress,
        frame,
    });
    if (!signed) throw new Error('Failed to sign with relay server.');

    return signed;
}
