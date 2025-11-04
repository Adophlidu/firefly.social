import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { ArticlePlatform } from '@/providers/types/Article.js';
import type {
    CollectArticleResponse,
    GetCollectStatusResponse,
    GetSponsorMintStatusResponse,
    MintBySponsorResponse,
    NFTMintingResponse,
    SponsorMintOptions,
} from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

class FireflyWalletTransaction {
    async getSponsorMintStatus(options: Omit<SponsorMintOptions, 'contractExt'>) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/platform/mint/status');
        const response = await fireflySessionHolder.fetch<GetSponsorMintStatusResponse>(url, {
            method: 'POST',
            body: JSON.stringify(options),
        });

        return resolveFireflyResponseData(response);
    }

    async mintNFTBySponsor(options: SponsorMintOptions) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/mint/platform');
        const response = await fireflySessionHolder.fetch<MintBySponsorResponse>(url, {
            method: 'POST',
            body: JSON.stringify(options),
        });

        const data = resolveFireflyResponseData(response);
        if (!data.status) throw new Error(data.errormessage || 'Failed to mint');

        return data;
    }

    async getArticleCollectStatus(articleId: string, address: string, type: ArticlePlatform) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/article/mint/status');
        const response = await fireflySessionHolder.fetch<GetCollectStatusResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                articleType: type,
                walletAddress: address,
                originalId: articleId,
            }),
        });

        return resolveFireflyResponseData(response);
    }

    async freeCollectArticle(articleId: string, address: string, type: ArticlePlatform) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/mint/article');
        const response = await fireflySessionHolder.fetch<CollectArticleResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                articleType: type,
                walletAddress: address,
                originalId: articleId,
            }),
        });

        const data = resolveFireflyResponseData(response);
        if (!data.status) throw new Error(data.errormessage || 'Failed to collect article');

        return data;
    }

    async getArticleMetadata(articleId: string, hash: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/article/add/metadata');
        const response = await fireflySessionHolder.fetch<NFTMintingResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                originalId: articleId,
                hash,
            }),
        });

        return resolveFireflyResponseData(response);
    }
}

export { FireflyWalletTransaction };
export const fireflyWalletTransactionProvider = new FireflyWalletTransaction();
