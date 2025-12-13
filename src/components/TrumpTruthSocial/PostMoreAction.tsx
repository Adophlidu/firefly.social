import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import MoreIcon from '@/assets/more.svg';
import PostIcon from '@/assets/post.svg';
import ShareIcon from '@/assets/share.svg';
import LinkIcon from '@/assets/small-link.svg';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tooltip } from '@/components/Tooltip.js';
import { SITE_URL_OFFICIAL } from '@/constants/static.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { openWindow } from '@/helpers/openWindow.js';
import { useCopyText } from '@/hooks/useCopyText.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface MoreProps {
    post: Post;
}

export const PostMoreAction = memo<MoreProps>(function PostMoreAction({ post }) {
    const truthSocialLink = post.permalink || SITE_URL_OFFICIAL;
    const [, handleCopy] = useCopyText(truthSocialLink);

    const isLogin = useIsLogin();

    return (
        <MoreActionMenu
            className="z-10"
            button={
                <Tooltip content={<Trans>More</Trans>} placement="top">
                    <MoreIcon width={20} height={20} className="text-secondary" />
                </Tooltip>
            }
        >
            <MenuGroup>
                <MenuItem>
                    {({ close }) => (
                        <MenuButton
                            onClick={() => {
                                close();
                                handleCopy();
                            }}
                        >
                            <LinkIcon width={18} height={18} />
                            <span className="font-bold leading-[22px] text-main">
                                <Trans>Copy link</Trans>
                            </span>
                        </MenuButton>
                    )}
                </MenuItem>
                <MenuItem>
                    {({ close }) => (
                        <MenuButton
                            onClick={() => {
                                close();
                                if (!isLogin) {
                                    openLoginModal();
                                    return;
                                }
                                openComposeModal({
                                    type: 'compose',
                                    chars: truthSocialLink,
                                });
                            }}
                        >
                            <PostIcon width={18} height={18} />
                            <span className="font-bold leading-[22px] text-main">
                                <Trans>Post with link</Trans>
                            </span>
                        </MenuButton>
                    )}
                </MenuItem>
                <MenuItem>
                    {({ close }) => (
                        <MenuButton
                            onClick={() => {
                                close();
                                openWindow(truthSocialLink);
                            }}
                        >
                            <ShareIcon width={18} height={18} />
                            <span className="font-bold leading-[22px] text-main">
                                <Trans>View on website</Trans>
                            </span>
                        </MenuButton>
                    )}
                </MenuItem>
            </MenuGroup>
        </MoreActionMenu>
    );
});
