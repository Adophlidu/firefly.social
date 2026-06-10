import { buildPolymarketShareImageUrl } from '@/helpers/polymarketShareImage.js';
import {
    type PolymarketShareImagePayload,
    SHARE_IMAGE_ASPECT_RATIO,
    SHARE_IMAGE_FILE_NAME,
} from '@/hooks/prediction/usePolymarketShareImageActions.js';
import { ShareImageModalRef } from '@/modals/ShareImageModal/refs.js';

/** FW-7696 "Share image" — the preview modal with Copy / Download / Post (AC-16). */
export function openPolymarketSharePreview(payload: PolymarketShareImagePayload, onPost: () => void) {
    ShareImageModalRef.open({
        imageUrl: buildPolymarketShareImageUrl(payload.params),
        aspectRatio: SHARE_IMAGE_ASPECT_RATIO,
        fileName: SHARE_IMAGE_FILE_NAME,
        enableCopy: true,
        onPost,
    });
}
