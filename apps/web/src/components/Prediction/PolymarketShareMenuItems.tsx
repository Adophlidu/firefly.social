'use client';

import SendIcon from '@dimensiondev/assets/send.svg';
import ShareImageIcon from '@dimensiondev/assets/share-image.svg';
import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

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
 */
export const PolymarketShareMenuItems = memo(function PolymarketShareMenuItems({
    payload,
}: PolymarketShareMenuItemsProps) {
    const { isPosting, postWithImage } = usePolymarketShareImageActions(payload);

    return (
        <>
            <MenuItem>
                {({ close }) => (
                    <MenuButton
                        onClick={async () => {
                            await postWithImage();
                            close();
                        }}
                    >
                        {isPosting ? (
                            <LoadingIcon width={18} height={18} className="animate-spin" />
                        ) : (
                            <SendIcon width={18} height={18} />
                        )}
                        <span className="font-bold leading-[22px] text-main">
                            <Trans>Post with image</Trans>
                        </span>
                    </MenuButton>
                )}
            </MenuItem>
            <MenuItem>
                {({ close }) => (
                    <MenuButton
                        onClick={() => {
                            openPolymarketSharePreview(payload, postWithImage);
                            close();
                        }}
                    >
                        <ShareImageIcon width={18} height={18} />
                        <span className="font-bold leading-[22px] text-main">
                            <Trans>Share image</Trans>
                        </span>
                    </MenuButton>
                )}
            </MenuItem>
        </>
    );
});
