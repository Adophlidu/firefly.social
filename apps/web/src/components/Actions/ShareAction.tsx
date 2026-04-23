'use client';

import SendIcon from '@dimensiondev/assets/send.svg';
import ShareIcon from '@dimensiondev/assets/share.svg';
import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { memo } from 'react';

import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tooltip } from '@/components/Tooltip.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';

interface ShareActionProps {
    link: string;
    onClick?: () => void;
}

export const ShareAction = memo(function ShareAction({ link, onClick }: ShareActionProps) {
    return (
        <MoreActionMenu
            className="z-10"
            button={
                <Tooltip content={<Trans>Share</Trans>} placement="top">
                    <motion.span
                        onClick={onClick}
                        whileTap={{ scale: 0.9 }}
                        className="text-second hover:bg-link/[0.2] hover:text-link inline-flex size-7 items-center justify-center rounded-full"
                    >
                        <ShareIcon width={17} height={16} />
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
                            <span className="text-main font-bold leading-[22px]">
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
