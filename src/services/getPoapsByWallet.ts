import { FireflyPlatform } from '@/constants/enum.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/index.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export async function getPoapsByWallet(address: string) {
    const poaps = await FireflyEndpointProvider.getPOAPs(address);
    const nftIds = poaps.map((item) =>
        `${EthereumChainId.xDai}.${POAP_CONTRACT_ADDRESS}.${item.tokenId}`.toLowerCase(),
    );
    const bookmarkData =
        (await runInSafeAsync(() => FireflySocialMediaProvider.getBookmarksByIds(FireflyPlatform.NFTs, nftIds))) || [];
    const bookmarksMap = new Map<string, boolean>(
        bookmarkData.map((bookmark) => [bookmark.post_id.toLowerCase(), !!bookmark.has_book_marked]),
    );
    if (bookmarksMap.size) {
        const list = poaps.map((item) => {
            const id = `${EthereumChainId.xDai}.${POAP_CONTRACT_ADDRESS}.${item.tokenId}`.toLowerCase();
            return {
                ...item,
                hasBookmarked: bookmarksMap.get(id),
            };
        });
        return list;
    }
    return poaps;
}
