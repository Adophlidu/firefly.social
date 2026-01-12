'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { BigNumber } from 'bignumber.js';
import { useCallback, useState } from 'react';
import { useAsync } from 'react-use';
import urlcat from 'urlcat';
import { type Address } from 'viem';

import RED_PACKET_ABI from '@/abis/RedPacket.json' with { type: 'json' };
import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Loading } from '@/components/Loading.js';
import { AmountProgressText } from '@/components/RedPacket/AmountProgressText.js';
import { formatSenderName } from '@/components/RedPacket/helpers.js';
import { useAvailabilityComputed } from '@/components/RedPacket/hooks/useAvailabilityComputed.js';
import { useRedPacketCover } from '@/components/RedPacket/hooks/useRedPacketCover.js';
import { useRefundCallback } from '@/components/RedPacket/hooks/useRefundCallback.js';
import { useVerifyAndClaim } from '@/components/RedPacket/hooks/useVerifyAndClaim.js';
import { RedPacketCardFooter } from '@/components/RedPacket/RedPacketCardFooter.js';
import { RequirementsModal } from '@/components/RedPacket/RequirementsModal.js';
import { Timer } from '@/components/RedPacket/Timer.js';
import { Tooltip } from '@/components/Tooltip.js';
import { SUPPORTED_MEDIA_CORS_SOURCES } from '@/constants/computed.js';
import { NetworkType, RedpacketTxType } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/static.js';
import { Image } from '@/esm/Image.js';
import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { getNativeToken } from '@/helpers/getNativeToken.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { minus, ZERO } from '@/helpers/number.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { usePreloadImage } from '@/helpers/preloadImage.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { usePrivyAppkitAccountByNetwork } from '@/hooks/appkit/usePrivyAppkitAccountByNetwork.js';
import { useAvailableBalance } from '@/hooks/useAvailableBalance.js';
import { RedPacketModalRef } from '@/modals/RedPacketModal/index.js';
import { getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import { type RedPacketJSONPayload, RedPacketStatus } from '@/providers/types/FireflyRedPacket.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { TokenType } from '@/types/rp.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';

interface Props {
    payload: RedPacketJSONPayload;
    post: Post;
}

export function RedPacketCardContent({ payload, post }: Props) {
    const networkType = getNetworkTypeFromRpPayload(payload);

    const [requirementOpen, setRequirementOpen] = useState(false);

    // #region token detailed
    const {
        isSponsorable,
        parsedChainId,
        availability,
        password,
        isExpired,
        isBlacklist,
        computed: { canClaim, canRefund, listOfStatus },
        isEmpty,
        isClaimed,
    } = useAvailabilityComputed(payload, post);
    // #endregion

    const appkitAccount = usePrivyAppkitAccountByNetwork(networkType);
    const account = appkitAccount.account?.address || '';

    const { data: cover } = useRedPacketCover({
        ...payload,
        token: payload.token,
        sender: payload.sender.name,
        message: payload.sender.message,
        claimedAmount: availability?.claimed_amount,
        claimed: availability?.claimed,
    });

    const { value: estimateGas = ZERO, loading: estimateLoading } = useAsync(async () => {
        if (!canClaim || !parsedChainId || !password || !account || networkType === NetworkType.Solana) return;

        const client = createWagmiPublicClient(parsedChainId);
        return runInSafeAsync(async () => {
            return client.estimateContractGas({
                abi: RED_PACKET_ABI,
                functionName: 'claim',
                args: [payload.rpid, password, account],
                address: getRedPacketContractAddress(parsedChainId),
                account: account as Address,
            });
        });
    }, [account, canClaim, parsedChainId, payload.rpid, password, networkType]);

    const nativeToken = getNativeToken(networkType, parsedChainId);

    const balanceResult = useAvailableBalance(
        nativeToken.address as Address,
        new BigNumber(estimateGas.toString()).toNumber(),
        {
            chainId: parsedChainId,
            networkType,
            account,
        },
        RedpacketTxType.claim,
    );

    const { value: balance = 0 } = balanceResult ?? {};

    const handleShare = useCallback(async () => {
        const postUrl = urlcat(SITE_URL, getPostUrl(post));
        openComposeModal({
            type: 'compose',
            chars: [
                !isClaimed
                    ? t`🤑 Check this #FireflyLuckyDrop 🧧💰✨ on ${postUrl} !`
                    : t`🤑 Just claimed a #FireflyLuckyDrop 🧧💰✨ on ${postUrl} !`,
                ' \n\n',
                t`Grow your followers and engagement with Lucky Drop on Firefly!`,
            ],
            source: post.source,
        });
    }, [post, isClaimed]);

    const [{ loading: refundLoading }, refund] = useRefundCallback(payload.rpid, {
        chainId: parsedChainId,
        networkType,
    });

    const { isLoading: imageLoading } = usePreloadImage(
        cover?.backgroundImageUrl,
        SUPPORTED_MEDIA_CORS_SOURCES.includes(post.source),
    );

    const [{ isVerifying, isClaiming, claimStrategyStatus }, verifyAndClaim] = useVerifyAndClaim(
        { ...payload, chainId: parsedChainId },
        post.source,
        post,
    );

    const originSenderName = payload.sender.name;
    const senderName = formatSenderName(originSenderName);

    return (
        <>
            {isEmpty || isClaimed || isExpired ? (
                <ClickableArea
                    className="absolute right-3 top-3 z-10 flex cursor-pointer items-center justify-center text-nowrap rounded-full bg-[#E8E8FF] px-[13px] py-[7px] text-sm font-bold leading-4 opacity-75 backdrop-blur-[5px]"
                    onClick={() => {
                        RedPacketModalRef.open({
                            initialPath: urlcat('/detail', {
                                rpid: payload.rpid,
                                networkType,
                                _FINAL_VIEW_: true,
                            }),
                        });
                    }}
                >
                    <Trans>View detail</Trans>
                </ClickableArea>
            ) : (
                <Timer
                    className="absolute right-3 top-3 z-10"
                    endTime={payload.creation_time + payload.duration * 1000}
                />
            )}

            {cover && !imageLoading ? (
                <>
                    <div
                        className="relative flex w-full items-end justify-between rounded-[18px] px-[27px] pb-[22px]"
                        style={
                            cover
                                ? {
                                      backgroundSize: 'cover',
                                      backgroundRepeat: 'no-repeat',
                                      backgroundImage: `url("${encodeURI(cover.backgroundImageUrl)}")`,
                                      backgroundColor: cover.backgroundColor,
                                      aspectRatio: '10 / 7',
                                      color: cover.theme.normal.title1.color,
                                  }
                                : undefined
                        }
                    >
                        {isSponsorable ? (
                            <Image
                                alt="gasless"
                                aria-label="gasless"
                                src="/image/gasless.png"
                                className="pointer-events-none absolute left-0 top-0 size-[100px] overflow-hidden rounded-tl-[18px]"
                                width={100}
                                height={100}
                            />
                        ) : null}
                        <ClickableArea
                            className="absolute right-5 top-4 z-1 flex cursor-pointer items-center gap-1 rounded-full px-3 py-[6px] text-xs leading-3 text-white disabled:cursor-not-allowed"
                            style={{ background: 'rgba(0, 0, 0, 0.25)', backdropFilter: 'blur(5px)' }}
                            disabled={isVerifying}
                            onClick={async () => {
                                if (claimStrategyStatus?.length) setRequirementOpen(true);
                            }}
                        >
                            <ChainIcon chainId={parsedChainId} size={14} />
                            <span>
                                {resolveRedPacketStatus(listOfStatus) ||
                                    (networkType === NetworkType.Ethereum
                                        ? EVMChainResolver.chainName(parsedChainId)
                                        : 'Solana')}
                            </span>
                        </ClickableArea>
                        <div
                            style={{
                                borderWidth: 0,
                                position: 'absolute',
                                top: '50%',
                                left: 0,
                                background: 'linear-gradient(to bottom, rgba(16,16,16,0) 0%, rgba(16,16,16,0.5) 100%)',
                                width: '100%',
                                height: '50%',
                                borderRadius: '0 0 18px 18px',
                            }}
                        />
                        <div className="z-10 max-w-[50%]">
                            <div className="mb-2 line-clamp-2 max-w-full text-[20px] font-bold">
                                {payload.sender.message}
                            </div>
                            <Tooltip content={senderName === `@${originSenderName}` ? '' : originSenderName}>
                                <div className="text-medium opacity-80">{senderName}</div>
                            </Tooltip>
                        </div>

                        {cover && payload.token && availability ? (
                            <div className="z-10 flex max-w-[50%] flex-col items-end gap-2">
                                <div className="flex w-full justify-center text-[12px] font-bold">
                                    {availability.claimed || 0} / {payload.shares} <Trans>Claims</Trans>
                                </div>
                                <AmountProgressText
                                    theme={cover?.theme}
                                    amount={payload.total}
                                    token={{
                                        type: TokenType.Fungible,
                                        symbol: payload.token?.symbol,
                                        decimals: payload.token?.decimals,
                                    }}
                                    shares={payload.shares}
                                    remainingShares={minus(payload.shares, availability.claimed || 0).toNumber()}
                                    ContainerStyle={{
                                        padding: '7px 0',
                                        borderRadius: 8,
                                    }}
                                    AmountTextStyle={{
                                        height: 28,
                                        borderRadius: 8,
                                    }}
                                    SymbolTextStyle={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        lineHeight: '14px',
                                        whiteSpace: 'nowrap',
                                    }}
                                />
                            </div>
                        ) : null}
                    </div>
                    <RedPacketCardFooter
                        post={post}
                        isBlacklist={!!isBlacklist}
                        payload={payload}
                        isClaimed={isClaimed}
                        isEmpty={isEmpty}
                        isExpired={isExpired}
                        isClaiming={isClaiming}
                        isSponsorable={isSponsorable}
                        canRefund={canRefund}
                        handleShare={handleShare}
                        handleRefund={refund}
                        refundLoading={refundLoading}
                        canClaim={canClaim}
                        balance={balance}
                        isRefunded={listOfStatus.includes(RedPacketStatus.refunded)}
                        estimateLoading={estimateLoading}
                        onClaim={async () => {
                            const result = await verifyAndClaim();
                            if (!result && !!claimStrategyStatus?.length) setRequirementOpen(true);
                        }}
                    />
                </>
            ) : (
                <Loading className="!min-h-[338px]" />
            )}

            {requirementOpen ? (
                <RequirementsModal
                    open
                    post={post}
                    claimStrategyStatus={claimStrategyStatus}
                    showResults={listOfStatus.length === 0}
                    isVerifying={isVerifying}
                    isClaiming={isClaiming}
                    onClose={() => setRequirementOpen(false)}
                    onVerifyAndClaim={async () => {
                        const result = await verifyAndClaim();
                        if (result) setRequirementOpen(false);
                    }}
                />
            ) : null}
        </>
    );
}

function resolveRedPacketStatus(listOfStatus: RedPacketStatus[]) {
    if (listOfStatus.includes(RedPacketStatus.claimed)) return 'Claimed';
    if (listOfStatus.includes(RedPacketStatus.refunded)) return 'Refunded';
    if (listOfStatus.includes(RedPacketStatus.expired)) return 'Expired';
    if (listOfStatus.includes(RedPacketStatus.empty)) return 'Empty';
    return '';
}
