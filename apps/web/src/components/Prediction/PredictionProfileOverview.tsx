'use client';

import { BET_PROFILE_FOLLOW_BUTTON_ID } from '@dimensiondev/constants/static';
import { PredictionPlatform, Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { isZero } from '@dimensiondev/web3/numbers';
import { formatAddressEthereum } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { useMemo } from 'react';
import urlcat from 'urlcat';

import { ShareAction } from '@/components/Actions/ShareAction.js';
import { Avatar } from '@/components/Avatar.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { PolymarketVolumeTraded } from '@/components/Polymarket/PolymarketVolumeTraded.js';
import { toRate } from '@/components/Polymarket/toRate.js';
import { PredictionPlatformName } from '@/components/Prediction/PredictionPlatformName.js';
import { PredictionProfileFollowButton } from '@/components/Prediction/PredictionProfileFollowButton.js';
import { ProfileSourceIcon } from '@/components/ProfileSourceIcon.js';
import { Link } from '@/esm/Link.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { usePredictionProfileData } from '@/hooks/prediction/usePredictionProfileData.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import { useShortShareUrl } from '@/hooks/useShortShareUrl.js';
import { getPolymarketProfileBalance } from '@/providers/firefly/prediction/getPolymarketProfileBalance.js';
import {
    captureOpinionProfileDetailClick,
    capturePolymarketProfileDetailClick,
} from '@/providers/telemetry/capturePolymarketEvent.js';
import type { PredictionProfileDataForUI } from '@/types/prediction.js';

interface PredictionProfileOverviewProps {
    profile: PredictionProfileDataForUI;
    address: string;
    platform: PredictionPlatform;
}

export function PredictionProfileOverview({ profile, platform, address }: PredictionProfileOverviewProps) {
    const isOpinion = platform === PredictionPlatform.Opinion;

    const shareBaseUrl = urlcat(SITE_URL, RouteResolver.betsProfile(address, { platform }));
    const shareLongUrl = useShareUrl(shareBaseUrl);
    const { register: registerShareLink } = useShortShareUrl(shareLongUrl);

    const { name, avatar, source, socialProfile, handle } = usePredictionProfileData({
        platform,
        address,
        fallbackInfo: { name: profile.platform_name, avatar: profile.platform_avatar },
    });
    const { data } = useQuery({
        queryKey: ['polymarket-balance', profile.proxy],
        enabled: !!profile.proxy && !isOpinion,
        queryFn: () => getPolymarketProfileBalance(profile.proxy, true),
    });
    const { balance, positionValue, cashBalance } = useMemo(() => {
        if (isOpinion || !data?.wallet)
            return {
                balance: profile.balance,
                positionValue: profile.notfill_balance,
                cashBalance: profile.cash_balance,
            };

        return {
            balance: data.balance || 0,
            positionValue: data.position_balance || 0,
            cashBalance: data.cash_balance || 0,
        };
    }, [profile, isOpinion, data]);

    const dataConfig = useMemo(() => {
        return compact([
            {
                label: (
                    <Trans>
                        <PredictionPlatformName platform={platform} /> PnL(%)
                    </Trans>
                ),
                value: (
                    <span className={profile.pnl < 0 ? 'text-danger' : 'text-success'}>
                        {formatPolymarketNumber(profile.pnl, { sign: true })}
                        {profile.pnl_rate !== undefined && profile.pnl_rate !== null
                            ? `(${toRate(profile.pnl_rate)})`
                            : null}
                    </span>
                ),
            },
            isOpinion
                ? null
                : {
                      label: <Trans>Total Gains</Trans>,
                      value: (
                          <span>
                              {formatPolymarketNumber(profile.gains, {
                                  sign: true,
                              })}
                          </span>
                      ),
                  },
            isOpinion
                ? null
                : {
                      label: <Trans>Total Losses</Trans>,
                      value: (
                          <span>
                              {profile.losses
                                  ? `${formatPolymarketNumber(-Math.abs(profile.losses), {
                                        sign: true,
                                    })}`
                                  : 0}
                          </span>
                      ),
                  },
            {
                label: <Trans>Total Value</Trans>,
                value: <span>{formatPolymarketNumber(balance)}</span>,
            },
            {
                label: <Trans>Current Positions</Trans>,
                value: <span>{formatPolymarketNumber(positionValue)}</span>,
            },
            {
                label: <Trans>Available Balance</Trans>,
                value: <span>{isZero(cashBalance) ? '$0' : `${formatTokenUSD(cashBalance)}`}</span>,
            },
            isOpinion
                ? null
                : {
                      label: <Trans>Biggest Win</Trans>,
                      value: (
                          <span>
                              {profile.largest_win !== undefined && profile.largest_win !== null
                                  ? formatPolymarketNumber(profile.largest_win, { sign: true })
                                  : '-'}
                          </span>
                      ),
                  },
            isOpinion
                ? null
                : {
                      label: <Trans>Markets Traded</Trans>,
                      value: <span>{profile.position_traded ?? '-'}</span>,
                  },
            {
                label: isOpinion ? <Trans>Volume Traded</Trans> : <Trans>Volume Traded(shares)</Trans>,
                value: isOpinion ? (
                    profile.volume && profile.volume > 1 ? (
                        Math.floor(profile.volume)
                    ) : (
                        formatPolymarketNumber(profile.volume) || '0'
                    )
                ) : (
                    <PolymarketVolumeTraded key="volume-traded" address={address} proxyAddress={profile.proxy} />
                ),
            },
        ]);
    }, [address, profile, isOpinion, platform, balance, positionValue, cashBalance]);

    const profileUrl =
        isSocialSource(source) && handle
            ? resolveProfileUrl(source, handle)
            : resolveProfileUrl(Source.Wallet, profile.wallet || profile.proxy);

    const handleWalletProfileClick = () => {
        const isFireflyUser = !!socialProfile?.account;
        const targetFireflyAccountId = socialProfile?.account?.accountID || socialProfile?.fireflyAccountId;

        if (platform === PredictionPlatform.Polymarket) {
            capturePolymarketProfileDetailClick({
                target_polymarket_name: profile.platform_name,
                target_proxy_wallet_address: profile.proxy,
                target_wallet_address: profile.wallet,
                is_firefly_user: isFireflyUser,
                target_firefly_account_id: targetFireflyAccountId,
            });
        } else if (platform === PredictionPlatform.Opinion) {
            captureOpinionProfileDetailClick({
                target_opinion_name: profile.platform_name,
                target_proxy_wallet_address: profile.proxy,
                target_wallet_address: profile.wallet,
                is_firefly_user: isFireflyUser,
                target_firefly_account_id: targetFireflyAccountId,
            });
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-4 px-4 pt-3">
                <Link href={profileUrl} className="relative" onClick={handleWalletProfileClick}>
                    <Avatar
                        src={avatar || getStampAvatarByProfileId(Source.Wallet, profile.wallet)}
                        alt="avatar"
                        size={40}
                        className="size-10 rounded-full border border-highlight"
                    />
                    {isSocialSource(source) ? (
                        <ProfileSourceIcon
                            source={source}
                            size={16}
                            className="absolute -bottom-1 -right-2 z-10 size-4 rounded-full border border-white"
                        />
                    ) : null}
                </Link>
                <div className="min-w-0">
                    <Link
                        className="block truncate whitespace-nowrap text-lg font-semibold text-main"
                        href={profileUrl}
                        onClick={handleWalletProfileClick}
                    >
                        {name || <PredictionPlatformName platform={platform} />}
                    </Link>
                    <div className="ml-auto flex items-center text-[13px] font-medium text-second">
                        {formatAddressEthereum(address, 4, 2)}
                        <CopyTextButton
                            className="ml-2 text-second"
                            size={14}
                            text={address}
                            data-prevent-progress
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                        />
                    </div>
                </div>
                <div className="ml-auto shrink-0" id={BET_PROFILE_FOLLOW_BUTTON_ID}>
                    <PredictionProfileFollowButton
                        address={address}
                        platform={platform}
                        fallbackName={profile.platform_name}
                        fallbackAvatar={profile.platform_avatar}
                    />
                </div>
            </div>
            {profile.tags?.length ? (
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    {profile.tags.map((tag, i) => (
                        <span
                            key={i}
                            className="h-[26px] rounded-full border border-line bg-lightBg px-3 font-inter text-xs font-medium !leading-6 text-main"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            ) : null}
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="text-base font-bold leading-6 text-main">
                        <Trans>Overview</Trans>
                    </div>
                    <ShareAction cellType="Prediction" link={shareLongUrl} register={registerShareLink} />
                </div>
                <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3">
                    {dataConfig.map((item, i) => (
                        <div key={i} className="flex flex-col gap-1 rounded-xl bg-lightBg p-3">
                            <span className="text-xs text-second">{item.label}</span>
                            <div className="text-sm font-semibold text-main">{item.value ?? '-'}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
