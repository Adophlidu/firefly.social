import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import type { Address } from 'viem';

import FireflyRoundIcon from '@/assets/firefly.round.svg';
import TipIcon from '@/assets/tips.svg';
import { NoSSR } from '@/components/NoSSR.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { TipsTransactionActions } from '@/components/Tips/TipsTransactionActions.js';
import { WalletBaseMoreAction } from '@/components/WalletBaseMoreAction.js';
import { Source, TipsDetailViewType, TipsNotificationType } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { Link } from '@/esm/Link.js';
import { useRouter } from '@/esm/navigation.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatTokenAmount } from '@/helpers/formatTokenAmount.js';
import { getChainName } from '@/helpers/getChainName.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { useDefaultFireflyAvatar } from '@/hooks/useDefaultFireflyAvatar.js';
import type { TipsNotificationData } from '@/providers/types/Firefly.js';

interface TipsNotificationItemProps {
    data: TipsNotificationData;
}

function getAccountInfo(data: TipsNotificationData) {
    switch (data.notification_type) {
        case TipsNotificationType.Tip: {
            const avatar = data.from_account_info?.avatar;
            const displayName = data.from_account_info?.displayName;

            return {
                avatar: avatar || getStampAvatarByProfileId(Source.Wallet, data.fromAddress),
                displayName: displayName || formatAddress(data.fromAddress, 4, undefined, false),
                link: getProfileUrl({ source: Source.Wallet, profileId: data.fromAddress }),
            };
        }
        case TipsNotificationType.Like: {
            const avatar = data.liker_account_info?.avatar;
            const displayName = data.liker_account_info?.displayName;

            return {
                avatar: avatar || null,
                displayName: displayName || null,
                link: data.liker_account_info?.account_uid
                    ? RouteResolver.profile({ source: Source.Firefly, profileId: data.liker_account_info.account_uid })
                    : null,
            };
        }
        default:
            safeUnreachable(data.notification_type);
            return null;
    }
}

function TipsNotificationMoreAction({ data }: { data: TipsNotificationData }) {
    if (data.notification_type === TipsNotificationType.Tip) {
        return <WalletBaseMoreAction showTips={false} autoQueryEns address={data.fromAddress as Address} />;
    }

    return null;
}

export function TipsNotificationItem({ data }: TipsNotificationItemProps) {
    const router = useRouter();
    const defaultAvatarUrl = useDefaultFireflyAvatar();
    const fromAccountInfo = getAccountInfo(data);

    const fromAvatar = (
        <Image
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full bg-secondary object-cover"
            src={fromAccountInfo?.avatar || defaultAvatarUrl}
            alt={fromAccountInfo?.displayName || 'Firefly'}
        />
    );

    const handleTipsClick = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().length !== 0) return;

        router.push(
            RouteResolver.tx(
                data.chain_id,
                data.tx_hash,
                data.notification_type === TipsNotificationType.Tip
                    ? TipsDetailViewType.Receiver
                    : TipsDetailViewType.Sender,
            ),
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cursor-pointer border-b border-secondaryLine px-4 py-3 hover:bg-bg dark:border-line"
            onClick={handleTipsClick}
        >
            <div className="flex w-full items-start gap-4">
                <TipIcon className="shrink-0 text-secondary" width={24} height={24} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                        {fromAccountInfo?.link ? (
                            <Link onClick={stopPropagation} href={fromAccountInfo.link}>
                                {fromAvatar}
                            </Link>
                        ) : (
                            fromAvatar
                        )}
                        <div className="flex items-center space-x-2">
                            <FireflyRoundIcon fontSize={15} width={15} height={15} />
                            {data.timestamp ? (
                                <span className="text-xs leading-4 text-secondary">
                                    <TimestampFormatter time={data.timestamp} />
                                </span>
                            ) : null}
                            <TipsNotificationMoreAction data={data} />
                        </div>
                    </div>
                    <div className="mt-2 text-medium font-medium text-main">
                        {data.notification_type === TipsNotificationType.Tip ? (
                            <Trans>
                                {fromAccountInfo?.link ? (
                                    <Link
                                        onClick={stopPropagation}
                                        className="font-bold hover:underline"
                                        href={fromAccountInfo.link}
                                    >
                                        {fromAccountInfo?.displayName || '-'}
                                    </Link>
                                ) : (
                                    <span className="font-bold">{fromAccountInfo?.displayName || '-'}</span>
                                )}{' '}
                                tipped you{' '}
                                <Link
                                    onClick={stopPropagation}
                                    href={resolveTokenPageUrl({
                                        identity: data.token_symbol,
                                        chainId: data.chain_id,
                                    })}
                                    className="font-bold"
                                >{`${formatTokenAmount(data.amount)} $${data.token_symbol}`}</Link>{' '}
                                on <span className="font-bold">{getChainName(data.chain_id)}</span>
                            </Trans>
                        ) : (
                            <Trans>
                                {fromAccountInfo?.link ? (
                                    <Link
                                        onClick={stopPropagation}
                                        className="font-bold hover:underline"
                                        href={fromAccountInfo.link}
                                    >
                                        {fromAccountInfo?.displayName || '-'}
                                    </Link>
                                ) : (
                                    <span className="font-bold">{fromAccountInfo?.displayName || '-'}</span>
                                )}{' '}
                                liked your <span className="font-bold">tip</span>
                            </Trans>
                        )}
                    </div>
                    {data.notification_type === TipsNotificationType.Tip ? (
                        <NoSSR>
                            <TipsTransactionActions
                                className="mt-1.5"
                                txHash={data.tx_hash}
                                liked={data.has_liked}
                                reposted={data.has_reposted}
                                fromAddress={data.fromAddress}
                                toAddress={data.toAddress}
                                fromAccountId={data.from_account_info?.account_uid}
                                toAccountId={data.to_account_info?.account_uid}
                                tokenSymbol={data.token_symbol}
                                chainId={data.chain_id}
                                view={
                                    data.notification_type === TipsNotificationType.Tip
                                        ? TipsDetailViewType.Receiver
                                        : TipsDetailViewType.Sender
                                }
                            />
                        </NoSSR>
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
}
