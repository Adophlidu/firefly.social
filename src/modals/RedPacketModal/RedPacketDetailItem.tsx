import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { memo, useContext } from 'react';
import urlcat from 'urlcat';

import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { FireflyPlatform, NetworkPluginID, NetworkType, type SocialSource } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/static.js';
import { Image } from '@/esm/Image.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { resolveSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { RedPacketAccountItem } from '@/modals/RedPacketModal/RedPacketAccountItem.js';
import { RedPacketActionButton } from '@/modals/RedPacketModal/RedPacketActionButton.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

interface HistoryInfo {
    rp_msg: string;
    redpacket_id: string;
    received_time?: string;
    token_decimal: number;
    total_amounts?: string;
    token_symbol: string;
    token_amounts?: string;
    token_logo: string;
    chain_id: number;
    creator?: string;
    claim_numbers?: string;
    total_numbers?: string;
    claim_amounts?: string;
    create_time?: number;
    redpacket_status?: FireflyRedPacketAPI.RedPacketStatus;
    ens_name?: string;
    claim_strategy?: FireflyRedPacketAPI.ClaimStrategy[];
    share_from?: string;
    theme_id?: string;
    post_on?: Array<{
        platform: FireflyPlatform;
        postId: string;
        handle?: string;
    }>;
}

interface Props {
    history: HistoryInfo;
    isDetail?: boolean;
}

const PlatformButton = memo(function PlatformButton(props: {
    platform: FireflyPlatform;
    postId: string;
    className: string;
}) {
    const { platform, postId, className } = props;
    const source = resolveSourceFromFireflyPlatform(platform);
    if (!SORTED_SOCIAL_SOURCES.find((x) => x === source)) return null;

    return (
        <a
            href={urlcat(SITE_URL, `/post/${platform}/${postId}`)}
            target="_blank"
            className={className}
            rel="noreferrer noopener"
        >
            <SocialSourceIcon source={source as SocialSource} />
        </a>
    );
});

function resolvePluginId(networkType = NetworkType.Ethereum) {
    switch (networkType) {
        case NetworkType.Ethereum:
            return NetworkPluginID.PLUGIN_EVM;
        case NetworkType.Solana:
            return NetworkPluginID.PLUGIN_SOLANA;
        default:
            safeUnreachable(networkType);
            return NetworkPluginID.PLUGIN_EVM;
    }
}

export const RedPacketDetailItem = memo<Props>(function RedPacketDetailItem({
    isDetail,

    history: {
        creator,
        ens_name,
        chain_id,
        post_on,
        claim_amounts,
        redpacket_status,
        redpacket_id,
        rp_msg,
        token_symbol,
        token_decimal,
        total_amounts,
        create_time,
        received_time,
        claim_numbers,
        total_numbers,
        token_logo,
        token_amounts,
        share_from,
    },
}) {
    const { history } = useRouter();
    const { networkType } = useContext(RedPacketContext);
    const { account } = useChainContext({ networkType });
    const networkDescriptor = getNetworkDescriptor(
        resolvePluginId(networkType),
        networkType === NetworkType.Solana ? SolanaChainId.Mainnet : chain_id,
    );

    const logoUrl = token_logo !== 'missing.png' ? token_logo : undefined;
    const message = rp_msg || <Trans>Hope this sparks a smile.</Trans>;

    return (
        <div className="light mb-3 flex w-full flex-col rounded-lg bg-white p-0">
            <section className="flex items-center justify-between">
                <div
                    className={`relative h-auto w-full rounded-lg bg-gradient-to-b from-blue-100 to-blue-50 p-3 max-md:p-8`}
                    style={{
                        background:
                            networkDescriptor?.backgroundGradient ??
                            'linear-gradient(180deg, rgba(98, 126, 234, 0.15) 0%, rgba(98, 126, 234, 0.05) 100%)',
                    }}
                >
                    <div
                        className="absolute bottom-0 left-[400px] z-0 h-[61px] w-[114px] opacity-20"
                        style={{
                            background: networkDescriptor
                                ? `url(${networkDescriptor.icon}) 0% 0% / 114px 114px no-repeat`
                                : undefined,
                        }}
                    />
                    <div className="light flex justify-between">
                        <div className="min-w-0 grow">
                            <div className="flex w-full">
                                <TextOverflowTooltip content={message} className="break-all">
                                    <div
                                        className={classNames(
                                            'break-all text-[14px] font-bold text-main',
                                            isDetail ? 'text-left' : 'truncate',
                                        )}
                                    >
                                        {message}
                                    </div>
                                </TextOverflowTooltip>
                            </div>
                            <div className="flex w-full text-[14px] leading-[18px]">
                                <div className="mr-1 truncate text-secondary">
                                    {create_time ? <Trans>Create time:</Trans> : <Trans>Received time:</Trans>}
                                </div>
                                <div
                                    className={classNames('truncate text-main', {
                                        hidden: !redpacket_id,
                                    })}
                                >
                                    {create_time ? (
                                        <Trans>{dayjs(create_time * 1000).format('MM/DD/YYYY HH:mm')} (UTC+8)</Trans>
                                    ) : null}
                                    {received_time ? (
                                        <Trans>
                                            {dayjs(Number.parseInt(received_time, 10) * 1000).format(
                                                'MM/DD/YYYY HH:mm',
                                            )}{' '}
                                            (UTC+8)
                                        </Trans>
                                    ) : null}
                                </div>
                            </div>

                            {creator || share_from ? (
                                <div className="flex items-center text-[14px] leading-[18px]">
                                    <div className="mr-1 text-secondary">
                                        <Trans>Creator:</Trans>
                                    </div>
                                    <RedPacketAccountItem
                                        address={creator}
                                        ens={ens_name}
                                        shareFrom={!isValidAddressEthereum(share_from) ? share_from : undefined}
                                        networkType={networkType}
                                        isDarkFont
                                    />
                                </div>
                            ) : null}
                            {post_on?.length && isDetail ? (
                                <div className="flex items-center text-[14px] leading-[18px]">
                                    <div className="mr-1 text-secondary">
                                        <Trans>Post on</Trans>
                                    </div>
                                    <div className="flex text-main">
                                        {post_on
                                            ?.sort((a, b) => {
                                                if (a.platform === b.platform) return 0;
                                                if (a.platform === FireflyPlatform.Lens) return 1;
                                                if (b.platform === FireflyPlatform.Lens) return -1;
                                                return 0;
                                            })
                                            .map((x) => (
                                                <PlatformButton
                                                    key={x.postId}
                                                    platform={x.platform}
                                                    postId={x.postId}
                                                    className="mr-2"
                                                />
                                            ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        {redpacket_status ? (
                            <RedPacketActionButton
                                redpacketStatus={redpacket_status}
                                rpid={redpacket_id}
                                account={account}
                                chainId={chain_id}
                                networkType={networkType}
                            />
                        ) : null}
                    </div>

                    <section className="light mt-[15px] flex w-full flex-nowrap items-center justify-between">
                        {claim_numbers || total_numbers ? (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="flex items-center gap-x-[2px] text-[14px] text-main">
                                    <Trans>
                                        <span className="text-secondary">Claimed: </span>
                                        <span className="mr-[6px]">
                                            {claim_numbers}/{total_numbers}
                                        </span>
                                        <span>
                                            {formatBalance(claim_amounts, token_decimal, {
                                                significant: 2,
                                                isPrecise: true,
                                            })}
                                            /
                                            {formatBalance(total_amounts, token_decimal ?? 18, {
                                                significant: 2,
                                                isPrecise: true,
                                            })}
                                        </span>
                                        <span>{token_symbol}</span>
                                    </Trans>
                                </div>
                                {logoUrl ? (
                                    <Image
                                        className="ml-[6px] rounded-full"
                                        alt={token_symbol}
                                        src={logoUrl}
                                        width={18}
                                        height={18}
                                    />
                                ) : null}
                            </div>
                        ) : null}
                        {token_amounts ? (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="flex items-center gap-x-[2px] text-[14px] text-secondary">
                                    <span className="text-main">
                                        <Trans>Received</Trans>
                                    </span>
                                    {formatBalance(token_amounts, token_decimal, {
                                        significant: 2,
                                        isPrecise: true,
                                    })}{' '}
                                    {token_symbol}
                                </div>
                                {logoUrl ? (
                                    <Image
                                        className="ml-[6px] rounded-full"
                                        alt={token_symbol}
                                        src={logoUrl}
                                        width={18}
                                        height={18}
                                    />
                                ) : null}
                            </div>
                        ) : null}
                        {!isDetail ? (
                            <button
                                className={
                                    'z-10 flex cursor-pointer items-center justify-center bg-none p-0 text-xs font-bold text-main'
                                }
                                onClick={() => {
                                    history.push(
                                        urlcat('/detail', {
                                            rpid: redpacket_id,
                                            networkType,
                                        }),
                                    );
                                }}
                            >
                                <Trans>More details</Trans>
                            </button>
                        ) : null}
                    </section>
                </div>
            </section>
        </div>
    );
});
