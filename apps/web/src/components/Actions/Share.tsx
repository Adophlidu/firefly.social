'use client';

import SendIcon from '@dimensiondev/assets/send.svg';
import { SITE_URL } from '@dimensiondev/envs/web';
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
import { openComposeModal } from '@/controllers/openComposeModal.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import { captureShareIconClickEvent } from '@/providers/telemetry/captureClickEvent.js';
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
                        onClick={() => {
                            captureShareIconClickEvent('Post');
                            capturePostActionEvent('share', post);
                        }}
                        whileTap={{ scale: 0.9 }}
                        className="group inline-flex size-7 items-center justify-center rounded-full hover:bg-link/[0.2] hover:text-link disabled:opacity-60"
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
                            <span className="font-bold leading-[22px] text-main">
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
