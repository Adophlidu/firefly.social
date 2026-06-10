import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import { openComposeModal } from '@/controllers/openComposeModal.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { fetchImageAsMediaObject } from '@/helpers/fetchImageAsMediaObject.js';
import { buildPolymarketShareImageUrl, type PolymarketShareImageParams } from '@/helpers/polymarketShareImage.js';

export interface PolymarketShareImagePayload {
    params: PolymarketShareImageParams;
    /** The firefly detail link (with `sid`) carried as the compose text. */
    link: string;
}

export const SHARE_IMAGE_FILE_NAME = 'firefly_position_share.png';
/** The share images are 750x1200 (FW-7696 spec A5). */
export const SHARE_IMAGE_ASPECT_RATIO = '750 / 1200';

/**
 * FW-7696 — "Post with image": compose with the generated PNG attached and the detail link as
 * text. Failures are surfaced via an error toast and swallowed (callers can `await` and close
 * their menu without handling rejections). The "Share image" preview lives in the component
 * layer (`openPolymarketSharePreview`) — hooks must not import modals.
 */
export function usePolymarketShareImageActions(payload: PolymarketShareImagePayload) {
    const [{ loading: isPosting }, postWithImage] = useAsyncFn(async () => {
        try {
            const imageUrl = buildPolymarketShareImageUrl(payload.params);
            const image = await fetchImageAsMediaObject(imageUrl, SHARE_IMAGE_FILE_NAME);
            openComposeModal({
                type: 'compose',
                chars: payload.link,
                images: [image],
            });
        } catch {
            enqueueErrorMessage(t`Failed to generate the share image. Please try again.`);
        }
    }, [payload.params, payload.link]);

    return { isPosting, postWithImage };
}
