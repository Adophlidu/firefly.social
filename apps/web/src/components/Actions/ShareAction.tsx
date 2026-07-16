'use client';

import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { memo } from 'react';

import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { PostWithLinkButton } from '@/components/Actions/PostWithLinkButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { ShareButtonWithAnimation } from '@/components/Posts/ShareButton.js';
import { PolymarketShareMenuItems } from '@/components/Prediction/PolymarketShareMenuItems.js';
import { Tooltip } from '@/components/Tooltip.js';
import type { PolymarketShareImagePayload } from '@/hooks/prediction/usePolymarketShareImageActions.js';
import { captureShareIconClickEvent, type ShareIconCellType } from '@/providers/telemetry/captureClickEvent.js';

interface ShareActionProps {
    /** Resolves the short link — called (and awaited) only when a menu item that needs it is clicked. */
    register: () => Promise<string>;
    /** Extra telemetry fired on the icon click itself — never triggers `register()`. */
    onIconClick?: () => void;
    cellType?: ShareIconCellType;
    /** FW-7696 — renders "Post with image" / "Share image" above the link options. */
    shareImage?: PolymarketShareImagePayload | null;
}

export const ShareAction = memo(function ShareAction({
    register,
    onIconClick,
    cellType,
    shareImage,
}: ShareActionProps) {
    return (
        <MoreActionMenu
            className="z-10"
            button={
                <Tooltip content={<Trans>Share</Trans>} placement="top">
                    <motion.span
                        data-testid={cellType === 'Prediction' ? 'prediction-activity-share' : undefined}
                        onClick={() => {
                            if (cellType) captureShareIconClickEvent(cellType);
                            onIconClick?.();
                        }}
                        whileTap={{ scale: 0.9 }}
                        className="inline-flex size-7 items-center justify-center rounded-full text-second hover:bg-link/[0.2] hover:text-link"
                    >
                        <ShareButtonWithAnimation />
                    </motion.span>
                </Tooltip>
            }
        >
            <MenuGroup>
                {shareImage ? <PolymarketShareMenuItems payload={shareImage} /> : null}
                <MenuItem>{({ close }) => <PostWithLinkButton getLink={register} onClick={close} />}</MenuItem>
                <MenuItem>{({ close }) => <CopyLinkButton getLink={register} onClick={close} />}</MenuItem>
            </MenuGroup>
        </MoreActionMenu>
    );
});
