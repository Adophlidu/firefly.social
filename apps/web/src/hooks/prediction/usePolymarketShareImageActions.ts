import { FileMimeType } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import { openComposeModal } from '@/controllers/openComposeModal.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import type {
    PolymarketShareImageParams,
    PolymarketSharePositionParams,
    PolymarketShareSportInfo,
} from '@/helpers/polymarketShareImage.js';
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
    /**
     * FW-7848 — lazily resolves the param overrides that align a timeline activity's share with the
     * wallet's authoritative position (holder identity + server PnL), fetched only when the user
     * shares. Best-effort: any unresolved field is omitted, leaving the computed timeline value.
     */
    resolveOverrides?: () => Promise<Partial<PolymarketSharePositionParams> | undefined>;
}

/**
 * Resolves the final render params. For a position/timeline card it folds in, best-effort and in
 * parallel: the authoritative identity + PnL overrides (timeline activities, FW-7848) and — when the
 * market turns out to be a sports one — the matchup context. A failed lookup keeps the base params.
 */
export async function resolvePolymarketShareParams(
    payload: PolymarketShareImagePayload,
): Promise<PolymarketShareImageParams> {
    const { params, resolveSport, resolveOverrides } = payload;
    if (params.type !== 'position') return params;

    const [overrides, sport] = await Promise.all([
        resolveOverrides ? resolveOverrides().catch(() => undefined) : undefined,
        !params.sport && resolveSport ? resolveSport().catch(() => undefined) : undefined,
    ]);

    let result: PolymarketSharePositionParams = params;
    if (overrides) result = { ...result, ...overrides };
    if (sport) result = { ...result, sport };
    return result;
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
