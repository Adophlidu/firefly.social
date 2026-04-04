'use client';

import DownloadIcon from '@dimensiondev/assets/download-tip.svg';
import MoreIcon from '@dimensiondev/assets/more-circle.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { type Address } from 'viem';

import { ChainInfo } from '@/app/[locale]/(normal)/tx/[chain_id]/[hash]/components/ChainInfo.js';
import { TransactionDate } from '@/app/[locale]/(normal)/tx/[chain_id]/[hash]/components/TransactionDate.js';
import { TxLink } from '@/app/[locale]/(normal)/tx/[chain_id]/[hash]/components/TxLink.js';
import { Comeback } from '@/components/Comeback.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { NoSSR } from '@/components/NoSSR.js';
import { TipsTransactionActions } from '@/components/Tips/TipsTransactionActions.js';
import { WalletEnsName } from '@/components/Tips/WalletEnsName.js';
import { WalletBaseMoreAction } from '@/components/WalletBaseMoreAction.js';
import { TipsDetailViewType } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { formatTokenAmount } from '@/helpers/formatTokenAmount.js';
import { getMaintainAccountInfo } from '@/helpers/getMaintainAccountInfo.js';
import { multipliedBy } from '@/helpers/number.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { type TipsDetail as TipsDetailType } from '@/providers/types/Firefly.js';

interface TipsDetailProps {
    tipsData: TipsDetailType;
    view: TipsDetailViewType;
}

export const TipsDetail = memo<TipsDetailProps>(function TipsDetail({ tipsData, view }) {
    const accountInfo = getMaintainAccountInfo(tipsData, view);
    if (!accountInfo) notFound();

    const isSender = view === TipsDetailViewType.Sender;
    const { maintainAccountInfo, targetAccountInfo } = accountInfo;

    const targetAccount = (
        <Link href={targetAccountInfo.link} className="flex items-center gap-1">
            <Image
                width={28}
                height={28}
                alt={targetAccountInfo.displayName}
                src={targetAccountInfo.avatar}
                className="size-7 rounded-full object-cover"
            />
            <span className="text-main font-semibold">{targetAccountInfo.displayName}</span>
        </Link>
    );

    return (
        <div>
            <div className="border-line bg-primaryBottom sticky top-0 z-30 flex h-[60px] items-center justify-between border-b px-4">
                <div className="flex min-w-0 items-center gap-7">
                    <Comeback className="text-lightMain cursor-pointer" />
                    <span className="text-lightMain min-w-0 truncate text-xl font-bold">
                        <Trans>Transaction</Trans>
                    </span>
                </div>
                <NoSSR>
                    <WalletBaseMoreAction
                        icon={<MoreIcon width={24} height={24} className="text-main" />}
                        autoQueryEns
                        address={maintainAccountInfo.address as Address}
                    />
                </NoSSR>
            </div>
            <div className="p-4">
                <div className="flex gap-3">
                    <Link href={maintainAccountInfo.link} className="shrink-0">
                        <Image
                            width={40}
                            height={40}
                            src={maintainAccountInfo.avatar}
                            alt={maintainAccountInfo.displayName}
                            className="size-10 rounded-full object-cover"
                        />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <Link href={maintainAccountInfo.link} className="text-main break-all text-base font-semibold">
                            {maintainAccountInfo.displayName}
                            <NoSSR>
                                <WalletEnsName address={maintainAccountInfo.address} />
                            </NoSSR>
                        </Link>
                    </div>
                </div>
                <div className="mt-2 space-y-4 pl-0 md:-mt-1 md:pl-[52px]">
                    <div className="flex flex-wrap items-center text-base">
                        {isSender ? (
                            <Trans>
                                <span className="border-main text-main flex h-[30px] cursor-pointer items-center gap-1 rounded-lg border px-2">
                                    <DownloadIcon width={14} height={14} />
                                    <span className="font-medium">Sent a tip</span>
                                </span>
                                <span className="text-second mx-3">to</span>
                                {targetAccount}
                            </Trans>
                        ) : (
                            <Trans>
                                <span className="border-main text-main flex h-[30px] cursor-pointer items-center gap-1 rounded-lg border px-2">
                                    <DownloadIcon width={14} height={14} />
                                    <span className="font-medium">Received a tip</span>
                                </span>
                                <span className="text-second mx-3">from</span>
                                {targetAccount}
                            </Trans>
                        )}
                    </div>
                    <div className="bg-lightBg flex items-center justify-between rounded-lg p-3">
                        <Link
                            href={resolveTokenPageUrl({
                                identity: tipsData.token_symbol,
                                chainId: tipsData.chain_id,
                            })}
                            className="flex items-center gap-2"
                        >
                            {tipsData.token_icon ? (
                                <Image
                                    alt={tipsData.token_symbol}
                                    src={tipsData.token_icon}
                                    width={36}
                                    height={36}
                                    className="size-9 rounded-full object-cover"
                                />
                            ) : null}
                            <div className="flex flex-col">
                                <span className="text-main text-base font-medium">{tipsData.token_name}</span>
                                <span className="text-second text-sm">{tipsData.token_symbol}</span>
                            </div>
                        </Link>
                        <div className="flex flex-col text-right">
                            <span
                                className={classNames(
                                    'text-base font-semibold',
                                    isSender ? 'text-main' : 'text-success',
                                )}
                            >{`${isSender ? '-' : '+'}${formatTokenAmount(tipsData.amount)}`}</span>
                            {tipsData.token_price ? (
                                <span>
                                    $
                                    {renderShrankPrice(
                                        formatPrice(multipliedBy(tipsData.token_price, tipsData.amount).toString()) ||
                                            '',
                                    )}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <NoSSR>
                        <TipsTransactionActions
                            txHash={tipsData.tx_hash}
                            tokenSymbol={tipsData.token_symbol}
                            view={view}
                            chainId={tipsData.chain_id}
                            fromAddress={tipsData.from_address}
                            toAddress={tipsData.to_address}
                            fromAccountId={tipsData.from_account?.firefly_uid}
                            toAccountId={tipsData.to_account?.firefly_uid}
                            liked={tipsData.has_liked}
                            reposted={tipsData.has_reposted}
                            autoQuery
                        />
                    </NoSSR>
                    <div className="space-y-3 pt-4">
                        <div className="flex min-w-0 items-center justify-between gap-2">
                            <span className="text-second shrink-0 text-sm">
                                <Trans>Transaction Hash</Trans>
                            </span>
                            {tipsData.tx_hash ? (
                                <NoSSR>
                                    <TxLink chainId={tipsData.chain_id} hash={tipsData.tx_hash} />
                                </NoSSR>
                            ) : (
                                '--'
                            )}
                        </div>
                        {tipsData.height ? (
                            <div className="flex min-w-0 items-center justify-between gap-2">
                                <span className="text-second shrink-0 text-sm">
                                    <Trans>Block</Trans>
                                </span>
                                <span className="text-main truncate text-sm font-medium">{tipsData.height}</span>
                            </div>
                        ) : null}
                        <div className="flex min-w-0 items-center justify-between gap-2">
                            <span className="text-second shrink-0 text-sm">
                                <Trans>Status</Trans>
                            </span>
                            <span
                                className={classNames(
                                    'text-sm font-medium',
                                    tipsData.status === 'success' ? 'text-success' : 'text-warn',
                                )}
                            >
                                {tipsData.status === 'success' ? <Trans>Success</Trans> : <Trans>Unknown</Trans>}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-second text-sm">
                                <Trans>Network</Trans>
                            </span>
                            <ChainInfo chainId={tipsData.chain_id} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-second text-sm">
                                <Trans>Time</Trans>
                            </span>
                            <span className="text-main text-sm font-medium">
                                {tipsData.timestamp ? <TransactionDate time={tipsData.timestamp} /> : '--'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
