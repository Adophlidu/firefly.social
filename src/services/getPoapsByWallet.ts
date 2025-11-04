import { FireflyPlatform } from '@/constants/enum.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/index.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { getFireflyBookmarksByIds } from '@/providers/firefly/endpoints/getFireflyBookmarkIds.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export async function getPoapsByWallet(address: string) {
    const poaps = await fireflyEndpointProvider.getPOAPs(address);
    const nftIds = poaps.map((item) =>
        `${EthereumChainId.xDai}.${POAP_CONTRACT_ADDRESS}.${item.tokenId}`.toLowerCase(),
    );
    const bookmarkData = (await runInSafeAsync(() => getFireflyBookmarksByIds(FireflyPlatform.NFTs, nftIds))) || [];
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
