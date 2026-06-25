'use client';

import SendIcon from '@dimensiondev/assets/send.svg';
import ShareImageIcon from '@dimensiondev/assets/share-image.svg';
import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo, useEffect, useState } from 'react';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { openPolymarketSharePreview } from '@/components/Prediction/openPolymarketSharePreview.js';
import {
    type PolymarketShareImagePayload,
    usePolymarketShareImageActions,
} from '@/hooks/prediction/usePolymarketShareImageActions.js';

interface PolymarketShareMenuItemsProps {
    payload: PolymarketShareImagePayload;
}

/**
 * FW-7696 — the "Post with image" / "Share image" menu entries, reused by the position cell share
 * menu and the predictions timeline share menu (rendered above the existing options).
 *
 * The image is generated on the client (satori → PNG), which takes a moment. Each entry calls
 * `event.preventDefault()` so headless-ui keeps the menu open, shows an in-place spinner while the
 * work runs, and only closes the menu once the compose / preview modal is actually up — otherwise the
 * menu vanishes on click and the modal appears a beat later, which reads as a dead click.
 */
export const PolymarketShareMenuItems = memo(function PolymarketShareMenuItems({
    payload,
}: PolymarketShareMenuItemsProps) {
    const { isPosting, postWithImage } = usePolymarketShareImageActions(payload);
    const [isPreviewing, setIsPreviewing] = useState(false);

    // The menu only mounts when the share popover opens; prefetch the satori chunk + fonts now so the
    // click pays render time only, not the one-time download.
    useEffect(() => {
        import('@/services/polymarketShareImage/index.js')
            .then((module) => module.warmupPolymarketShareImage(payload.params))
            .catch(() => {});
    }, [payload.params]);

    return (
        <>
            <MenuItem>
                {({ close }) => (
                    <MenuButton
                        disabled={isPosting}
                        onClick={async (event) => {
                            event.preventDefault();
                            await postWithImage();
                            close();
                        }}
                    >
                        {isPosting ? <LoadingIcon size={18} /> : <SendIcon width={18} height={18} />}
                        <span className="font-bold leading-[22px] text-main">
                            <Trans>Post with image</Trans>
                        </span>
                    </MenuButton>
                )}
            </MenuItem>
            <MenuItem>
                {({ close }) => (
                    <MenuButton
                        disabled={isPreviewing}
                        onClick={async (event) => {
                            event.preventDefault();
                            setIsPreviewing(true);

                            try {
                                await openPolymarketSharePreview(payload, postWithImage);
                                close();
                            } finally {
                                setIsPreviewing(false);
                            }
                        }}
                    >
                        {isPreviewing ? <LoadingIcon size={18} /> : <ShareImageIcon width={18} height={18} />}
                        <span className="font-bold leading-[22px] text-main">
                            <Trans>Share image</Trans>
                        </span>
                    </MenuButton>
                )}
            </MenuItem>
        </>
    );
});
