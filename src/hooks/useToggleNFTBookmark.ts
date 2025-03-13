import { t } from '@lingui/core/macro';
import { ZERO_ADDRESS } from '@masknet/web3-shared-evm';
import { useIsMutating, useMutation } from '@tanstack/react-query';
import { usePathname } from 'next/navigation.js';

import { FireflyPlatform } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { LoginModalRef } from '@/modals/controls.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';

export function useToggleNFTBookmark(options: { owner: string; nftId: string; strict?: boolean }) {
    const isLogin = useIsLogin();
    const pathname = usePathname();
    const mutationKey = ['toggle-bookmark', FireflyPlatform.NFTs, options.nftId];
    const isMutating = useIsMutating({ mutationKey, exact: true }) > 0;

    const isDetailPage = isRoutePathname(pathname, '/nft/:chainId/:address/:tokenId');

    const mutation = useMutation({
        mutationKey,
        mutationFn: async (hasBookmarked: boolean) => {
            if (!isLogin) {
                LoginModalRef.open();
                return;
            }

            const owner = options.owner || ZERO_ADDRESS;
            const nftId = options.strict ? options.nftId : options.nftId.toLowerCase();

            try {
                const result = !hasBookmarked
                    ? await FireflySocialMediaProvider.bookmarkNFT(nftId, owner)
                    : await FireflySocialMediaProvider.unbookmarkNFT(nftId, owner);
                if (!result) {
                    throw new Error('Bookmark operation failed.');
                }
                enqueueSuccessMessage(
                    hasBookmarked ? t`NFT removed from your Bookmarks` : t`NFT added to your Bookmarks`,
                );
                return result;
            } catch (error) {
                if (
                    hasBookmarked &&
                    !isDetailPage &&
                    error instanceof FetchError &&
                    error.text?.includes('Bookmark not exist')
                ) {
                    enqueueErrorMessage('Bookmark not exist, please try going to the detail page and un-bookmark it.');
                    return;
                }
                enqueueMessageFromError(
                    error,
                    hasBookmarked ? t`Failed to un-bookmark NFT.` : t`Failed to bookmark NFT.`,
                );
                throw error;
            }
        },
    });

    return [isMutating, mutation] as const;
}
