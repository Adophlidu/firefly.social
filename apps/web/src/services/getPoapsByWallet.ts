import { EMPTY_LIST } from '@dimensiondev/constants';
import { runInSafeAsync } from '@dimensiondev/utils';
import { gnosis } from 'viem/chains';

import { FireflyPlatform } from '@/constants/enum.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/static.js';
import { getFireflyBookmarksByIds } from '@/providers/firefly/endpoint/getFireflyBookmarkIds.js';
import { getPOAPs } from '@/providers/firefly/nft/getPOAPs.js';

export async function getPoapsByWallet(address: string) {
    const poaps = await getPOAPs(address);
    const nftIds = poaps.map((item) => `${gnosis.id}.${POAP_CONTRACT_ADDRESS}.${item.tokenId}`.toLowerCase());
    const bookmarkData =
        (await runInSafeAsync(() => getFireflyBookmarksByIds(FireflyPlatform.NFTs, nftIds))) || EMPTY_LIST;
    const bookmarksMap = new Map<string, boolean>(
        bookmarkData.map((bookmark) => [bookmark.post_id.toLowerCase(), !!bookmark.has_book_marked]),
    );
    if (bookmarksMap.size) {
        const list = poaps.map((item) => {
            const id = `${gnosis.id}.${POAP_CONTRACT_ADDRESS}.${item.tokenId}`.toLowerCase();
            return {
                ...item,
                hasBookmarked: bookmarksMap.get(id),
            };
        });
        return list;
    }
    return poaps;
}
