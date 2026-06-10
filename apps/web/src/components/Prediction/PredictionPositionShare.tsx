'use client';

import ImageIcon from '@dimensiondev/assets/image.svg';
import ShareImageIcon from '@dimensiondev/assets/share-image.svg';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Popover } from '@/components/Popover.js';
import { ShareButtonWithAnimation } from '@/components/Posts/ShareButton.js';
import { openPolymarketSharePreview } from '@/components/Prediction/openPolymarketSharePreview.js';
import { PolymarketShareMenuItems } from '@/components/Prediction/PolymarketShareMenuItems.js';
import { Tooltip } from '@/components/Tooltip.js';
import {
    type PolymarketShareImagePayload,
    usePolymarketShareImageActions,
} from '@/hooks/prediction/usePolymarketShareImageActions.js';

interface PredictionPositionShareButtonProps {
    payload: PolymarketShareImagePayload;
    className?: string;
}

/**
 * FW-7696 AC-9 — the hover share entry on a position cell (desktop). Opens a menu with
 * "Post with image" / "Share image".
 */
export const PredictionPositionShareButton = memo(function PredictionPositionShareButton({
    payload,
    className,
}: PredictionPositionShareButtonProps) {
    return (
        <MoreActionMenu
            className={className}
            button={
                <Tooltip content={<Trans>Share</Trans>} placement="top">
                    <span
                        data-testid="prediction-position-share"
                        className="inline-flex size-6 items-center justify-center rounded-full text-second hover:bg-link/[0.2] hover:text-link"
                    >
                        <ShareButtonWithAnimation />
                    </span>
                </Tooltip>
            }
        >
            <MenuGroup>
                <PolymarketShareMenuItems payload={payload} />
            </MenuGroup>
        </MoreActionMenu>
    );
});

interface PredictionPositionShareSheetProps {
    payload: PolymarketShareImagePayload;
    open: boolean;
    onClose: () => void;
}

/**
 * FW-7696 AC-10 — the bottom options opened by a long-press on the cell in mobile mode.
 */
export const PredictionPositionShareSheet = memo(function PredictionPositionShareSheet({
    payload,
    open,
    onClose,
}: PredictionPositionShareSheetProps) {
    const { isPosting, postWithImage } = usePolymarketShareImageActions(payload);

    return (
        <Popover open={open} onClose={onClose}>
            <div className="flex flex-col gap-1 pb-4">
                <button
                    type="button"
                    className="flex h-12 items-center gap-3 rounded-lg px-3 text-left hover:bg-bg"
                    onClick={async () => {
                        await postWithImage();
                        onClose();
                    }}
                >
                    {isPosting ? (
                        <LoadingIcon width={20} height={20} className="animate-spin" />
                    ) : (
                        <ImageIcon width={20} height={20} />
                    )}
                    <span className="font-bold text-main">
                        <Trans>Post with image</Trans>
                    </span>
                </button>
                <button
                    type="button"
                    className="flex h-12 items-center gap-3 rounded-lg px-3 text-left hover:bg-bg"
                    onClick={() => {
                        onClose();
                        openPolymarketSharePreview(payload, postWithImage);
                    }}
                >
                    <ShareImageIcon width={20} height={20} />
                    <span className="font-bold text-main">
                        <Trans>Share image</Trans>
                    </span>
                </button>
            </div>
        </Popover>
    );
});
