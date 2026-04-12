'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import type { ReadonlyURLSearchParams } from 'next/navigation.js';
import { type HTMLProps, memo, Suspense, useCallback, useContext, useMemo, useState, useTransition } from 'react';

import TokenPageLoading from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/loading.js';
import { Avatar } from '@/components/Avatar.js';
import { DisableScrollRestoreContext } from '@/components/DisableScrollRestore/index.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { SwapTimeline, type SwapTimelineProps } from '@/components/Swap/SwapTimeline.js';
import { TokenContext } from '@/components/Token/TokenContext.js';
import { Source } from '@/constants/enum.js';
import { NATIVE_TOKEN_ADDRESS } from '@/constants/okx.js';
import { Link } from '@/esm/Link.js';
import { usePathname, useRouter, useSearchParams } from '@/esm/navigation.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { getWalletProfileAvatar } from '@/helpers/getWalletProfileAvatar.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { swapActivityToTradeRecord } from '@/helpers/swapActivityToTradeRecord.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

function resolveTab(pathname: string, params: ReadonlyURLSearchParams, category: string) {
    const newParams = new URLSearchParams(params);
    newParams.set('tx', category);
    return `${pathname}?${newParams.toString()}`;
}

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
    const { ethereum, solana } = useWalletAccountAll();
    const isMyOwnWallet = isSameAddress(trader, ethereum.address) || isSameAddress(trader, solana.address);
    const subcategories = useMemo(() => {
        const list = [
            { value: 'following', label: <Trans>Following</Trans> },
            { value: 'mine', label: <Trans>Mine</Trans> },
        ];
        if (!trader || isMyOwnWallet) return list;
        return [
            {
                value: 'trader',
                label: traderName || formatAddress(trader, 4),
            },
            ...list,
        ];
    }, [isMyOwnWallet, trader, traderName]);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const account = chainId === SolanaChainId.Mainnet ? solana.address : ethereum.address;
    const pathname = usePathname();
    const params = useSearchParams();
    const [pendingCategory, setPendingCategory] = useState<string>();
    const subcategory =
        (isPending && pendingCategory) || (isMyOwnWallet ? 'mine' : params.get('tx') || subcategories[0].value);
    const isFollowing = subcategory === 'following';
    const isTrader = subcategory === 'trader';

    const { setTradeRecords } = useContext(TokenContext);
    const [traderAvatar, setTraderAvatar] = useState<string>();
    const handleActivitiesUpdate = useCallback(
        (data: SwapActivity[] | undefined) => {
            const records = data?.length
                ? compact(data.map((activity) => swapActivityToTradeRecord(activity, tokenAddress)))
                : EMPTY_LIST;
            setTradeRecords(records);
            if (isTrader && data?.length) setTraderAvatar(getWalletProfileAvatar(data[0].displayInfo));
        },
        [setTradeRecords, tokenAddress, isTrader],
    );
    const timelineProps: Omit<SwapTimelineProps, 'isFollowing' | 'address'> = {
        chainId,
        tokenAddress,
        onActivitiesUpdate: handleActivitiesUpdate,
        ignoreFilters: true,
    };

    return (
        <div {...props} className={classNames('flex grow flex-col gap-2', props.className)}>
            <div className="flex shrink-0 gap-2">
                {subcategories.map((x) => {
                    const selected = x.value === subcategory;
                    return (
                        <Link
                            key={x.value}
                            className={classNames(
                                'flex h-6 cursor-pointer list-none items-center justify-center gap-1 rounded-md px-1.5 text-xs leading-6 lg:flex-initial lg:justify-start',
                                selected ? 'bg-highlight text-white' : 'bg-thirdMain text-second hover:text-highlight',
                            )}
                            href={resolveTab(pathname, params, x.value)}
                            onClick={(e) => {
                                e.preventDefault();
                                setPendingCategory(x.value);
                                startTransition(() => {
                                    router.replace(resolveTab(pathname, params, x.value), { showProgress: false });
                                });
                            }}
                            aria-current={selected ? 'page' : undefined}
                        >
                            {x.value === 'trader' && trader ? (
                                <Avatar
                                    size={15}
                                    alt={trader}
                                    src={traderAvatar || getStampAvatarByProfileId(Source.Wallet, trader)}
                                />
                            ) : null}
                            {x.label}
                        </Link>
                    );
                })}
            </div>
            <Suspense
                fallback={
                    <div className="flex grow flex-col">
                        <TokenPageLoading />
                    </div>
                }
            >
                <DisableScrollRestoreContext value>
                    {isFollowing ? (
                        <SwapTimeline
                            isFollowing
                            {...timelineProps}
                            listSubScope={`${chainId}-${tokenAddress}-following`}
                            NoResultsFallbackProps={{
                                icon: null,
                                message: <Trans>No one you follow has traded this token.</Trans>,
                            }}
                        />
                    ) : subcategory === 'mine' || isMyOwnWallet ? (
                        account ? (
                            <SwapTimeline
                                address={account}
                                {...timelineProps}
                                listSubScope={`${chainId}-${tokenAddress}-${account}`}
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
                    ) : subcategory === 'trader' && trader ? (
                        <SwapTimeline
                            address={trader}
                            {...timelineProps}
                            listSubScope={`${chainId}-${tokenAddress}-${trader}`}
                            NoResultsFallbackProps={{
                                icon: null,
                                message: <Trans>No trade records</Trans>,
                            }}
                        />
                    ) : null}
                </DisableScrollRestoreContext>
            </Suspense>
        </div>
    );
});
