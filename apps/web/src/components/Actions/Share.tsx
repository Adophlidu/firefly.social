'use client';

import SendIcon from '@dimensiondev/assets/send.svg';
import { classNames } from '@dimensiondev/utils';
import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { type HTMLProps, memo } from 'react';
import urlcat from 'urlcat';

import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { ShareButtonWithAnimation } from '@/components/Posts/ShareButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { SITE_URL } from '@/constants/static.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import { capturePostActionEvent } from '@/providers/telemetry/capturePostActionEvent.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface ShareProps extends HTMLProps<HTMLDivElement> {
    post: Post;
    disabled?: boolean;
}

export const Share = memo<ShareProps>(function Share({ post, disabled = false, className }) {
    const baseUrl = urlcat(SITE_URL, getPostUrl(post));
    const url = useShareUrl(baseUrl);

    return (
        <MoreActionMenu
            className={classNames('z-10', className)}
            loginRequired={false}
            disabled={disabled}
            buttonClassName="!text-second"
            button={
                <Tooltip content={<Trans>Share</Trans>} placement="top" disabled={disabled}>
                    <motion.div
                        onClick={() => capturePostActionEvent('share', post)}
                        whileTap={{ scale: 0.9 }}
                        className="hover:bg-link/[0.2] hover:text-link group inline-flex size-7 items-center justify-center rounded-full disabled:opacity-60"
                    >
                        <ShareButtonWithAnimation />
                    </motion.div>
                </Tooltip>
            }
        >
            <MenuGroup>
                <MenuItem>
                    {({ close }) => (
                        <MenuButton
                            onClick={() => {
                                openComposeModal({
                                    chars: url,
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
                <MenuItem>{({ close }) => <CopyLinkButton link={url || ''} onClick={close} />}</MenuItem>
            </MenuGroup>
        </MoreActionMenu>
    );
});
