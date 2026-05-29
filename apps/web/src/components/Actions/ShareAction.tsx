'use client';

import SendIcon from '@dimensiondev/assets/send.svg';
import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { memo } from 'react';

import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { ShareButtonWithAnimation } from '@/components/Posts/ShareButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { captureShareIconClickEvent, type ShareIconCellType } from '@/providers/telemetry/captureClickEvent.js';

interface ShareActionProps {
    link: string;
    onClick?: () => void;
    cellType?: ShareIconCellType;
}

export const ShareAction = memo(function ShareAction({ link, onClick, cellType }: ShareActionProps) {
    return (
        <MoreActionMenu
            className="z-10"
            button={
                <Tooltip content={<Trans>Share</Trans>} placement="top">
                    <motion.span
                        onClick={() => {
                            if (cellType) captureShareIconClickEvent(cellType);
                            onClick?.();
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
                <MenuItem>
                    {({ close }) => (
                        <MenuButton
                            onClick={() => {
                                openComposeModal({
                                    chars: link,
                                });
                                close();
                            }}
                        >
                            <SendIcon width={18} height={18} />
                            <span className="font-bold leading-[22px] text-main">
                                <Trans>Post with link</Trans>
                            </span>
                        </MenuButton>
                    )}
                </MenuItem>
                <MenuItem>{({ close }) => <CopyLinkButton link={link || ''} onClick={close} />}</MenuItem>
            </MenuGroup>
        </MoreActionMenu>
    );
});
