'use client';

import ComposeAddIcon from '@dimensiondev/assets/compose-add.svg';
import ReplyIcon from '@dimensiondev/assets/reply.svg';
import { PageRoute, Source } from '@dimensiondev/enums';

import { ClickableButton } from '@/components/ClickableButton.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { useCurrentVisitingChannel } from '@/hooks/useCurrentVisitingChannel.js';
import { useCurrentVisitingPost } from '@/hooks/useCurrentVisitingPost.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

function isPredictionPage(pathname: string) {
    return pathname.startsWith('/polymarket') || pathname.startsWith('/opinion');
}

export function ComposeButtonForMobile() {
    const currentSource = useGlobalState.use.currentSource();
    const currentSocialSource = narrowToSocialSource(currentSource);

    const pathname = usePathname();
    const isPostPage = isRoutePathname(pathname, PageRoute.PostDetail, true);
    const isArticlePage = isRoutePathname(pathname, '/article/:detail', true);
    const isNFTPage = isRoutePathname(pathname, '/nft/:detail', false);
    const isLogin = useIsLogin();
    const isCurrentLogin = useIsLogin(currentSocialSource);
    const currentPost = useCurrentVisitingPost();
    const currentChannel = useCurrentVisitingChannel();

    if (!isLogin) return null;
    if (isPostPage && !isCurrentLogin) return null;
    if (isArticlePage || currentSource === Source.Article || isNFTPage || isPredictionPage(pathname)) return null;

    return (
        <ClickableButton
            className="fixed bottom-4 left-4 z-40 flex size-16 items-center justify-center rounded-full bg-fireflyBrand text-white outline-none dark:bg-white dark:text-fireflyBrand"
            onClick={() => {
                openComposeModal({
                    type: isPostPage ? 'reply' : 'compose',
                    post: currentPost,
                    channel: currentChannel,
                    source: isPostPage ? currentSocialSource : undefined,
                });
            }}
        >
            {isPostPage ? <ReplyIcon width={24} height={24} /> : <ComposeAddIcon width={24} height={24} />}
        </ClickableButton>
    );
}
