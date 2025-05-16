import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { type HTMLProps, memo, useCallback, useContext, useMemo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { SwapTimeline, type SwapTimelineProps } from '@/components/Swap/SwapTimeline.js';
import { TokenContext } from '@/components/Token/TokenContext.js';
import { Source } from '@/constants/enum.js';
import { NATIVE_TOKEN_ADDRESS } from '@/constants/okx.js';
import { useSearchParams } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';
import type { TradeRecord } from '@/types/token.js';
import { SolanaChainId } from '#masknet/web3-shared-solana';

interface Props extends HTMLProps<HTMLDivElement>, Pick<SwapTimelineProps, 'chainId' | 'tokenAddress'> {
    trader: string | undefined;
    traderName: string | undefined;
}

export const Transactions = memo<Props>(function Transactions({
    chainId,
    tokenAddress = NATIVE_TOKEN_ADDRESS,
    trader,
    traderName,
    ...props
}) {
    const subcategories = useMemo(() => {
        const list = [
            { value: 'following', label: <Trans>Following</Trans> },
            { value: 'mine', label: <Trans>Mine</Trans> },
        ];
        if (!trader) return list;
        return [
            {
                value: 'trader',
                label: traderName || formatAddress(trader, 4),
            },
            ...list,
        ];
    }, [trader, traderName]);

    const { ethereum, solana } = useWalletAccountAll();
    const account = chainId === SolanaChainId.Mainnet ? solana.address : ethereum.address;
    const params = useSearchParams();
    const tab = params.get('tab') || subcategories[0].value;
    const [subcategory = tab, setSubcategory] = useState<string>();
    const isFollowing = subcategory === 'following';

    const { setTradeRecords } = useContext(TokenContext);
    const handleActivitiesUpdate = useCallback(
        (data: SwapActivity[]) => {
            const records: TradeRecord[] = compact(
                data.map((activity) => {
                    const isSell = isSameAddress(activity.from_token?.address, tokenAddress);
                    const token = isSell ? activity.from_token : activity.to_token;
                    if (!token) return null;
                    return {
                        user: {
                            name: activity.displayInfo?.ensHandle,
                            address: activity.owner,
                            avatar:
                                activity.displayInfo?.fireflyAvatarUrl ||
                                activity.displayInfo?.avatarUrl ||
                                getStampAvatarByProfileId(Source.Wallet, activity.owner),
                        },
                        amount: token.amount_str,
                        uiAmount: token.amount_num,
                        decimals: token.decimal,
                        date: +activity.timestamp * 1000,
                        value: token.price ? +token.price : 0,
                        type: isSell ? 'sell' : 'buy',
                    };
                }),
            );
            setTradeRecords(records);
        },
        [setTradeRecords, tokenAddress],
    );
    const timelineProps: Omit<SwapTimelineProps, 'isFollowing' | 'address'> = {
        chainId,
        tokenAddress,
        onActivitiesUpdate: handleActivitiesUpdate,
    };

    return (
        <div {...props} className={classNames('flex flex-col gap-2', props.className)}>
            <div className="flex shrink-0 gap-2">
                {subcategories.map((x) => {
                    return (
                        <ClickableButton
                            key={x.value}
                            className={classNames(
                                'flex h-6 cursor-pointer list-none justify-center rounded-md px-1.5 text-xs leading-6 lg:flex-initial lg:justify-start',
                                subcategory === x.value
                                    ? 'bg-highlight text-white'
                                    : 'bg-thirdMain text-second hover:text-highlight',
                            )}
                            onClick={() => setSubcategory(x.value)}
                            aria-current={subcategory === x.value ? 'page' : undefined}
                        >
                            {x.label}
                        </ClickableButton>
                    );
                })}
            </div>
            {isFollowing ? (
                <SwapTimeline
                    isFollowing
                    {...timelineProps}
                    NoResultsFallbackProps={{
                        icon: null,
                        message: <Trans>No one you follow has traded this token.</Trans>,
                    }}
                />
            ) : subcategory === 'trader' && trader ? (
                <SwapTimeline
                    address={trader}
                    {...timelineProps}
                    NoResultsFallbackProps={{
                        icon: null,
                        message: <Trans>No trade records</Trans>,
                    }}
                />
            ) : subcategory === 'mine' ? (
                account ? (
                    <SwapTimeline
                        address={account}
                        {...timelineProps}
                        NoResultsFallbackProps={{
                            icon: null,
                            message: <Trans>You haven&apos;t traded this token.</Trans>,
                        }}
                    />
                ) : (
                    <NotLoginFallback
                        source={Source.Wallet}
                        message={<Trans>Connect your wallet to unlock all features</Trans>}
                    />
                )
            ) : null}
        </div>
    );
});
