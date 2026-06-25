import { t } from '@lingui/core/macro';

import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import {
    type PolymarketShareImagePayload,
    SHARE_IMAGE_ASPECT_RATIO,
    SHARE_IMAGE_FILE_NAME,
} from '@/hooks/prediction/usePolymarketShareImageActions.js';
import { ShareImageModalRef } from '@/modals/ShareImageModal/refs.js';

// The preview shows a blob: object URL; revoke the previous one when a new card is generated so we
// don't leak (the modal owns no revoke hook, and at most one preview is open at a time).
let lastObjectUrl: string | null = null;

/**
 * FW-7696 "Share image" — generate the card on the client (satori → PNG) and open the
 * Copy / Download / Post preview (AC-16). No worker round-trip; webp avatars render natively.
 */
export async function openPolymarketSharePreview(payload: PolymarketShareImagePayload, onPost: () => void) {
    try {
        const { createPolymarketShareImage } = await import('@/services/polymarketShareImage/index.js');
        const blob = await createPolymarketShareImage(payload.params);
        if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl);
        lastObjectUrl = URL.createObjectURL(blob);
        ShareImageModalRef.open({
            imageUrl: lastObjectUrl,
            aspectRatio: SHARE_IMAGE_ASPECT_RATIO,
            fileName: SHARE_IMAGE_FILE_NAME,
            enableCopy: true,
            onPost,
        });
    } catch {
        enqueueErrorMessage(t`Failed to generate the share image. Please try again.`);
    }
}
