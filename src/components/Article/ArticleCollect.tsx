import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { produce } from 'immer';
import { useMemo, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { useAccount, useChains } from 'wagmi';
import { sendTransaction } from 'wagmi/actions';

import CollectFillIcon from '@/assets/collect-fill.svg';
import LinkIcon from '@/assets/link-square.svg';
import { Avatar } from '@/components/Avatar.js';
import { ChainGuardButton } from '@/components/ChainGuardButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { queryClient } from '@/configs/queryClient.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { MintStatus } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { isZero } from '@/helpers/number.js';
import { openWindow } from '@/helpers/openWindow.js';
import { resolveArticleCollectProvider } from '@/helpers/resolveArticleCollectProvider.js';
import { resolveExplorerLink } from '@/helpers/resolveExplorerLink.js';
import { useArticleCollectStatus } from '@/hooks/useArticleCollectable.js';
import { MintParamsPanel } from '@/modals/FreeMintModal/MintParamsPanel.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { ParagraphAPI } from '@/providers/paragraph/index.js';
import { captureArticleCollectEvent } from '@/providers/telemetry/captureArticleCollectEvent.js';
import { type Article, ArticlePlatform } from '@/providers/types/Article.js';
import { EventId } from '@/providers/types/Telemetry.js';

interface ArticleCollectProps {
    article: Article;
}

export function ArticleCollect({ article }: ArticleCollectProps) {
    const account = useAccount();
    const chains = useChains();

    const platform = article.platform;

    const { data, isLoading: paramsLoading, isRefetching } = useArticleCollectStatus(article);
    const { data: collectParams, insufficientBalance } = data ?? {};

    const canCollect = [MintStatus.Mintable, MintStatus.MintAgain].includes(
        collectParams?.mintStatus || MintStatus.NotSupported,
    );
    const isFree = canCollect && !!collectParams?.gasStatus;

    // User can collect again by reopen the modal
    const [modalSessionCollected, setModalSessionCollected] = useState(false);
    const [txUrl, setTxUrl] = useState<string>();
    const [{ loading: collectLoading }, handleCollect] = useAsyncFn(async () => {
        if (!collectParams || !platform) return;

        const provider = resolveArticleCollectProvider(platform);
        if (!provider) return;

        try {
            let hash = '';
            let hasBalance = true;

            setModalSessionCollected(true);

            if (isFree) {
                try {
                    const result = await fireflyEndpointProvider.freeCollectArticle(
                        article.id,
                        account.address || '',
                        platform,
                    );
                    hash = result.hash;
                } catch (error) {
                    if (error instanceof Error && error.message.includes('insufficient funds')) {
                        hasBalance = false;
                        enqueueWarningMessage(<Trans>Sorry, today&apos;s free collect quota has been reached.</Trans>);
                    } else {
                        throw error;
                    }
                }
            }
            if (!isFree || !hasBalance) {
                if (account.address)
                    captureArticleCollectEvent(EventId.ARTICLE_COLLECT_SUBMIT, article.id, account.address, isFree);
                const confirmation = await sendTransaction(wagmiConfig, {
                    to: collectParams.txData.to as `0x${string}`,
                    value: BigInt(collectParams.txData.value),
                    data: collectParams.txData.inputData as `0x${string}`,
                });
                if (account.address)
                    captureArticleCollectEvent(EventId.ARTICLE_COLLECT_SUCCESS, article.id, account.address, isFree);

                if (!confirmation) return;
                hash = confirmation;
            }

            if (article.platform === ArticlePlatform.Paragraph) {
                const metadata = await fireflyEndpointProvider.getArticleMetadata(article.id, hash);
                await ParagraphAPI.addArticleMetadata(metadata);
            }

            const url = resolveExplorerLink(collectParams.chainId, hash, 'tx');
            if (url) {
                setTxUrl(url);
            }
            queryClient.setQueryData<typeof data>(['article-collect-status', article.platform, article.id], (data) => {
                if (!data) return;
                return produce(data, (draft) => {
                    draft.data.mintCount += 1;
                    draft.data.mintStatus = MintStatus.Minted;
                });
            });
            queryClient.refetchQueries({
                queryKey: ['article-collect-status', article.platform, article.id],
            });

            enqueueSuccessMessage(<Trans>Article collected successfully!</Trans>);
        } catch (error) {
            setModalSessionCollected(false);
            enqueueMessageFromError(error, <Trans>Failed to collect article.</Trans>);
            throw error;
        }
    }, [collectParams, platform, account.address, article.id, article.platform, isFree]);

    const chain = chains.find((x) => x.id === collectParams?.chainId);
    const nativeSymbol = chain?.nativeCurrency.symbol.toUpperCase() || '';
    const isSoldOut = collectParams?.mintStatus === MintStatus.SoldOut;
    const isCollected =
        collectParams?.mintStatus === MintStatus.Minted || collectParams?.mintStatus === MintStatus.MintAgain;

    const buttonText = useMemo(() => {
        if (collectLoading) return <Trans>Collecting</Trans>;
        if (isSoldOut) return <Trans>Sold Out</Trans>;
        if (isCollected) return <Trans>Collected</Trans>;
        if (isFree) return <Trans>Collect</Trans>;
        if (insufficientBalance && !isFree) return <Trans>Insufficient Balance</Trans>;
        if (!collectParams?.mintPrice || isZero(collectParams.mintPrice)) return <Trans>Collect</Trans>;
        return (
            <Trans>
                Collect for {collectParams.mintPrice} {nativeSymbol}
            </Trans>
        );
    }, [nativeSymbol, collectParams?.mintPrice, insufficientBalance, isFree, isSoldOut, isCollected, collectLoading]);

    if (!paramsLoading && (!collectParams || collectParams.chainId === 0)) {
        return (
            <div className="flex h-[198px] w-full items-center justify-center">
                <div className="text-[14px] leading-6 text-secondary">
                    <Trans>This article is no longer available</Trans>
                </div>
            </div>
        );
    }

    if (paramsLoading) {
        return (
            <div className="flex h-[198px] w-full items-center justify-center">
                <LoadingIcon className="text-main" />
            </div>
        );
    }

    const loading = collectLoading || paramsLoading || isRefetching;
    const disabled =
        isSoldOut || (account.isConnected && insufficientBalance && !isFree) || modalSessionCollected || loading;

    return (
        <div className="overflow-x-hidden px-6 pb-6 max-md:px-0 max-md:pb-4">
            <div className="mb-6 rounded-lg border border-secondaryLine px-3 py-2">
                <div className="line-clamp-2 text-left text-base font-bold leading-5 text-main">{article.title}</div>
                {article.author ? (
                    <div className="mt-[6px] flex items-center gap-2">
                        <Avatar src={article.author.avatar} size={20} alt={article.author.handle} />
                        <span className="text-medium leading-6 text-second">
                            {article.author.handle ?? formatAddressEthereum(article.author.id, 4)}
                        </span>
                        {isCollected ? <CollectFillIcon width={16} height={16} className="ml-auto mr-1.5" /> : null}
                    </div>
                ) : null}
                <div className="mt-1.5 flex gap-2 text-center text-base">
                    <div className="flex-1 rounded-lg bg-lightBg p-2.5">
                        <span className="text-second">
                            <Trans>Collected</Trans>
                        </span>
                        <span className="mt-2 block text-main">{nFormatter(collectParams?.mintCount || 0)}</span>
                    </div>
                    <div className="flex-1 rounded-lg bg-lightBg p-2.5">
                        <span className="text-second">
                            <Trans>Standard</Trans>
                        </span>
                        <span className="mt-2 block text-main">ERC721</span>
                    </div>
                </div>
            </div>

            {collectParams ? (
                <MintParamsPanel
                    mintParams={collectParams}
                    className="mt-6"
                    isLoading={false}
                    gasFee={data?.gasFee || '0'}
                    mintCount={1}
                    priceLabel={<Trans>Collect Price</Trans>}
                />
            ) : null}

            {txUrl ? (
                <ChainGuardButton
                    targetChainId={collectParams?.chainId}
                    className="mt-6 inline-flex w-full gap-1 max-md:mt-4"
                    loading={loading}
                    onlyLoading={!collectLoading}
                    onClick={(e) => {
                        e.stopPropagation();
                        openWindow(txUrl);
                    }}
                >
                    {buttonText}
                    <LinkIcon
                        width={18}
                        height={18}
                        className="cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            openWindow(txUrl);
                        }}
                    />
                </ChainGuardButton>
            ) : (
                <ChainGuardButton
                    targetChainId={collectParams?.chainId}
                    className={classNames(
                        'mt-6 inline-flex w-full gap-1 max-md:mt-4',
                        disabled ? 'cursor-not-allowed opacity-50' : '',
                    )}
                    loading={loading}
                    onlyLoading={!collectLoading}
                    onClick={disabled ? undefined : handleCollect}
                >
                    {buttonText}
                </ChainGuardButton>
            )}
        </div>
    );
}
