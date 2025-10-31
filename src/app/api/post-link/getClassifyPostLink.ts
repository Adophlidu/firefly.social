import { parseUrl } from '@firefly/utils';
import urlcat from 'urlcat';

import { getPostFromUrl } from '@/app/api/post-link/getPostFromUrl.js';
import { getPostIframeContent } from '@/app/api/post-link/getPostIframeContent.js';
import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { EVM_ADDRESS, TWEET_SPACE_REGEX } from '@/constants/regexp.js';
import { attemptUntil } from '@/helpers/attemptUntil.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import { resolveNFTDataFromUrl } from '@/helpers/resolveNFTDataFromUrl.js';
import { FireflyArticleProvider } from '@/providers/firefly/Article.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nft-scan/constants.js';
import type { EVM } from '@/providers/nft-scan/types.js';
import { OpenGraphProcessor } from '@/providers/og/Processor.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';
import type { Article } from '@/providers/types/Article.js';
import type { NFTDetail } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { getArticleIdFromUrl } from '@/services/getArticleIdFromUrl.js';
import { getSnapshotByLink } from '@/services/getSnapshotByLink.js';
import type { Frame, LinkDigestedResponse } from '@/types/frame.js';
import type { LinkDigested } from '@/types/og.js';
import type { ResponseJson } from '@/types/utility.js';

const IGNORE_HOSTS = [/^.+\.firefly\.social$/, 'localhost:3000', 'x.com'];

function isValidPostLink(url: string, enableFilter = false) {
    const parsed = parseUrl(url);
    if (!parsed) return false;

    // such as ens domains
    if (isValidDomainEthereum(url)) return false;

    // ignore hosts
    if (
        enableFilter &&
        IGNORE_HOSTS.some((pattern) =>
            typeof pattern === 'string' ? pattern === parsed.host : pattern.test(parsed.host),
        )
    ) {
        return false;
    }

    return true;
}

export interface GetClassifyPostLinkOnActionResult {
    oembed?: LinkDigested;
    frame?: Frame;
    html?: string;
    article?: Article;
    spaceId?: string;
    snapshot?: SnapshotProposal;
    nft?: NFTDetail;
    collection?: EVM.Collection;
    quote?: Post;
}

export async function getClassifyPostLink(url: string) {
    return attemptUntil<GetClassifyPostLinkOnActionResult | null>(
        [
            async () => {
                const quote = await getPostFromUrl(url);
                if (!quote) return null;
                return { quote };
            },
            async () => {
                const spaceId = url.match(TWEET_SPACE_REGEX)?.[3];
                if (!spaceId) return null;
                return { spaceId };
            },
            async () => {
                const snapshot = await getSnapshotByLink(url);
                if (!snapshot) return null;
                return { snapshot };
            },
            async () => {
                const articleId = await getArticleIdFromUrl(url);
                if (!articleId) return null;

                const article = await FireflyArticleProvider.getArticleById(articleId);
                if (!article) return null;

                return { article };
            },
            async () => {
                const nftParams = resolveNFTDataFromUrl(url);
                if (!nftParams || !NFTSCAN_CHAIN_IDS.includes(nftParams.chainId)) return null;

                const nft = await FireflyEndpointProvider.getNFTDetail(
                    nftParams.chainId,
                    nftParams.address,
                    nftParams.tokenId,
                );
                return nft ? { nft } : null;
            },
            async () => {
                const matched = url.match(EVM_ADDRESS);
                const address = matched?.[0];
                if (!address) return null;
                const collection = await FireflyEndpointProvider.detectCollection(address);
                return collection ? { collection } : null;
            },
            async () => {
                const html = getPostIframeContent(null, url);
                return html ? { html } : null;
            },
            async () => {
                if (env.external.NEXT_PUBLIC_FRAME !== STATUS.Enabled) return null;
                if (!url || !isValidPostLink(url, true)) return null;
                const response = await fetchJson<ResponseJson<LinkDigestedResponse>>(
                    urlcat(FIREFLY_WORKER_HOST, '/frame', {
                        link: url,
                    }),
                );
                if (!response.success) return null;
                return response.data.frame ? { frame: response.data.frame } : null;
            },
            async () => {
                if (env.external.NEXT_PUBLIC_OPENGRAPH !== STATUS.Enabled) return null;
                if (!url || !isValidPostLink(url)) return null;
                const oembed = await OpenGraphProcessor.digestDocumentUrl(url);
                return oembed ? { oembed } : null;
            },
        ],
        null,
        (x) => !x,
    );
}
