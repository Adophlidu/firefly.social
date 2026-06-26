import { FileMimeType } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import { openComposeModal } from '@/controllers/openComposeModal.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import type { PolymarketShareImageParams, PolymarketShareSportInfo } from '@/helpers/polymarketShareImage.js';
import { createLocalMediaObject } from '@/helpers/resolveMediaObjectUrl.js';

export interface PolymarketShareImagePayload {
    params: PolymarketShareImageParams;
    /** The firefly detail link (with `sid`) carried as the compose text. */
    link: string;
    /**
     * Lazily resolves the sports matchup context for a position cell — the position-list API carries
     * no team/score data, so it's fetched (event detail) only when the user actually shares.
     */
    resolveSport?: () => Promise<PolymarketShareSportInfo | undefined>;
}

/**
 * Resolves the final render params: for a position cell that turns out to be a sports market, fetches
 * and folds in the matchup context; otherwise returns the params unchanged. Best-effort — a failed
 * lookup falls back to the event card.
 */
export async function resolvePolymarketShareParams(
    payload: PolymarketShareImagePayload,
): Promise<PolymarketShareImageParams> {
    const { params, resolveSport } = payload;
    if (params.type !== 'position' || params.sport || !resolveSport) return params;

    try {
        const sport = await resolveSport();
        return sport ? { ...params, sport } : params;
    } catch {
        return params;
    }
}

export const SHARE_IMAGE_FILE_NAME = 'firefly_position_share.png';
/** The share images are 750x1060 (2x of the 375x530 redesign). */
export const SHARE_IMAGE_ASPECT_RATIO = '750 / 1060';

/**
 * FW-7696 — "Post with image": compose with the generated PNG attached and the detail link as
 * text. Failures are surfaced via an error toast and swallowed (callers can `await` and close
 * their menu without handling rejections). The "Share image" preview lives in the component
 * layer (`openPolymarketSharePreview`) — hooks must not import modals.
 */
export function usePolymarketShareImageActions(payload: PolymarketShareImagePayload) {
    const [{ loading: isPosting }, postWithImage] = useAsyncFn(async () => {
        try {
            const { createPolymarketShareImage } = await import('@/services/polymarketShareImage/index.js');
            const params = await resolvePolymarketShareParams(payload);
            const blob = await createPolymarketShareImage(params);
            const file = new File([blob], SHARE_IMAGE_FILE_NAME, { type: blob.type || FileMimeType.PNG });
            openComposeModal({
                type: 'compose',
                chars: payload.link,
                images: [createLocalMediaObject(file)],
            });
        } catch {
            enqueueErrorMessage(t`Failed to generate the share image. Please try again.`);
        }
    }, [payload]);

    return { isPosting, postWithImage };
}
