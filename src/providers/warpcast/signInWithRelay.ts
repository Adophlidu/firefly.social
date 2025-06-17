import { SITE_URL } from '@/constants/index.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { RelayConfirmationPopoverRef } from '@/modals/FrameViewerModal/controls.js';
import type { FrameV2 } from '@/types/frame.js';

export async function signInWithRelay(frame: FrameV2, fid: string, nonce: string) {
    const url = frame.x_url || SITE_URL;

    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const signed = await RelayConfirmationPopoverRef.openAndWaitForClose({
        siweUri: url,
        nonce,
        domain: u.hostname,
        frame,
    });
    if (!signed) throw new Error('Failed to sign with relay server.');

    return signed;
}
