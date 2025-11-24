import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { type HTMLProps, memo } from 'react';
import urlcat from 'urlcat';

import SendIcon from '@/assets/send.svg';
import ShareIcon from '@/assets/share.svg';
import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tooltip } from '@/components/Tooltip.js';
import { SITE_URL } from '@/constants/index.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { capturePostActionEvent } from '@/providers/telemetry/capturePostActionEvent.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface ShareProps extends HTMLProps<HTMLDivElement> {
    post: Post;
    disabled?: boolean;
}
export const Share = memo<ShareProps>(function Share({ className, post, disabled = false }) {
    const url = urlcat(SITE_URL, getPostUrl(post));

    return (
        <MoreActionMenu
            loginRequired={false}
            disabled={disabled}
            buttonClassName="!text-second"
            button={
                <Tooltip content={<Trans>Share</Trans>} placement="top" disabled={disabled}>
                    <motion.div
                        onClick={() => capturePostActionEvent('share', post)}
                        whileTap={{ scale: 0.9 }}
                        className="inline-flex size-7 items-center justify-center rounded-full hover:bg-link/[0.2] hover:text-link disabled:opacity-60"
                    >
                        <ShareIcon width={17} height={16} />
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
