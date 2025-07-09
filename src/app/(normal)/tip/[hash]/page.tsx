import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';
import { type Address, isHash } from 'viem';

import { ChainInfo } from '@/app/(normal)/tip/[hash]/components/ChainInfo.js';
import { TipsDate } from '@/app/(normal)/tip/[hash]/components/TipsDate.js';
import { TxLink } from '@/app/(normal)/tip/[hash]/components/TxLink.js';
import DownloadIcon from '@/assets/download-tip.svg';
import { Comeback } from '@/components/Comeback.js';
import { Image } from '@/components/Image.js';
import { NoSSR } from '@/components/NoSSR.js';
import { TipsTransactionActions } from '@/components/Tips/TipsTransactionActions.js';
import { WalletBaseMoreAction } from '@/components/WalletBaseMoreAction.js';
import { Source, TipsDetailViewType, TipsNotificationType } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { notFound } from '@/esm/navigation/server.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { formatTokenAmount } from '@/helpers/formatTokenAmount.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { multipliedBy } from '@/helpers/number.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { TipsAccountInfo, TipsDetail } from '@/providers/types/Firefly.js';
import type { NextPageProps } from '@/types/index.js';

interface Props
    extends NextPageProps<
        { hash: string },
        {
            view?: TipsDetailViewType;
        }
    > {}

function formatTipsAccount(address: string, accountInfo?: TipsAccountInfo) {
    const avatar =
        accountInfo?.firefly_avatar ||
        (accountInfo?.firefly_uuid
            ? getStampAvatarByProfileId(Source.Firefly, accountInfo.firefly_uuid)
            : getStampAvatarByProfileId(Source.Wallet, address));
    const displayName = accountInfo?.firefly_name || formatAddress(address, 4);

    return {
        avatar,
        address,
        displayName,
        link: RouteResolver.profile({
            source: Source.Wallet,
            profileId: address,
        }),
    };
}

function getMaintainAccountInfo(data: TipsDetail, view: TipsDetailViewType) {
    switch (view) {
        case TipsDetailViewType.Sender:
        case TipsDetailViewType.Receiver: {
            const isReceiver = view === TipsDetailViewType.Receiver;

            const maintainAccount = isReceiver ? data.to_account : data.from_account;
            const maintainAddress = isReceiver ? data.to_address : data.from_address;
            const targetAccount = isReceiver ? data.from_account : data.to_account;
            const targetAddress = isReceiver ? data.from_address : data.to_address;

            return {
                maintainAccountInfo: formatTipsAccount(maintainAddress, maintainAccount),
                targetAccountInfo: formatTipsAccount(targetAddress, targetAccount),
            };
        }
        default:
            safeUnreachable(view);
            return null;
    }
}

export default async function Page(props: Props) {
    await setupLocaleForSSR();

    const { hash } = await props.params;
    const { view = TipsDetailViewType.Sender } = await props.searchParams;

    if (!isHash(hash)) notFound();

    const tipsData = await runInSafeAsync(() =>
        FireflyEndpointProvider.getTipsTransactionDetail(hash, TipsNotificationType.Tip),
    );
    if (!tipsData) notFound();

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
                className="h-7 w-7 rounded-full object-cover"
            />
            <span className="font-semibold text-main">{targetAccountInfo.displayName}</span>
        </Link>
    );

    return (
        <div>
            <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
                <div className="flex min-w-0 items-center gap-7">
                    <Comeback className="cursor-pointer text-lightMain" />
                    <span className="min-w-0 truncate text-xl font-bold text-lightMain">
                        <Trans>Tip</Trans>
                    </span>
                </div>
                <NoSSR>
                    <WalletBaseMoreAction autoQueryEns address={maintainAccountInfo.address as Address} />
                </NoSSR>
            </div>
            <div className="flex gap-3 p-4">
                <div className="shrink-0">
                    <Link href={maintainAccountInfo.link}>
                        <Image
                            width={40}
                            height={40}
                            src={maintainAccountInfo.avatar}
                            alt={maintainAccountInfo.displayName}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    </Link>
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                    <Link href={maintainAccountInfo.link} className="text-base">
                        <span className="font-semibold text-main">{maintainAccountInfo.displayName}</span>
                    </Link>
                    <div className="flex flex-wrap items-center text-base">
                        {isSender ? (
                            <Trans>
                                <span className="flex h-[30px] cursor-pointer items-center gap-1 rounded-lg border border-main px-2 text-main">
                                    <DownloadIcon width={14} height={14} />
                                    <span className="font-medium">Sent a tip</span>
                                </span>
                                <span className="mx-3 text-second">to</span>
                                {targetAccount}
                            </Trans>
                        ) : (
                            <Trans>
                                <span className="flex h-[30px] cursor-pointer items-center gap-1 rounded-lg border border-main px-2 text-main">
                                    <DownloadIcon width={14} height={14} />
                                    <span className="font-medium">Received a tip</span>
                                </span>
                                <span className="mx-3 text-second">from</span>
                                {targetAccount}
                            </Trans>
                        )}
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-lightBg p-3">
                        <div className="flex items-center gap-2">
                            {tipsData.token_icon ? (
                                <Image
                                    alt={tipsData.token_symbol}
                                    src={tipsData.token_icon}
                                    width={36}
                                    height={36}
                                    className="h-9 w-9 rounded-full object-cover"
                                />
                            ) : null}
                            <div className="flex flex-col">
                                <span className="text-base font-medium text-main">{tipsData.token_name}</span>
                                <span className="text-sm text-second">{tipsData.token_symbol}</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
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
                            liked={tipsData.has_liked}
                            reposted={tipsData.has_reposted}
                            autoQuery
                        />
                    </NoSSR>
                    <div className="space-y-3 pt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-second">
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
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-second">
                                <Trans>Block</Trans>
                            </span>
                            <span className="text-sm font-medium text-main">{tipsData.height}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-second">
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
                            <span className="text-sm text-second">
                                <Trans>Network</Trans>
                            </span>
                            <ChainInfo chainId={tipsData.chain_id} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-second">
                                <Trans>Time</Trans>
                            </span>
                            <span className="text-sm font-medium text-main">
                                {tipsData.timestamp ? <TipsDate time={tipsData.timestamp} /> : '--'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
