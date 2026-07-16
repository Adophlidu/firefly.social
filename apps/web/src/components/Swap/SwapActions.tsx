'use client';

import LightningIcon from '@dimensiondev/assets/lightning-sharp.svg';
import MirrorIcon from '@dimensiondev/assets/mirror.svg';
import ShareImageIcon from '@dimensiondev/assets/share-image.svg';
import { Source, SwapAccessPath, TxReactionType } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { classNames } from '@dimensiondev/utils';
import { MenuItem } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { LikeButton } from '@/components/Actions/LikeButton.js';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { ShareButtonWithAnimation } from '@/components/Posts/ShareButton.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { queryClient } from '@/configs/queryClient.js';
import { openAndWaitForCloseComposeModal } from '@/controllers/openComposeModal.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { openShareImageModal } from '@/controllers/openShareImageModal.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { patchTransactionsQuery } from '@/helpers/patchTransactionsQuery.js';
import { resolveTxPageUrl } from '@/helpers/resolveTxPageUrl.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import { useShortShareUrl } from '@/hooks/useShortShareUrl.js';
import { createTxReaction } from '@/providers/firefly/endpoint/createTxReaction.js';
import { getSwapActivityByHash } from '@/providers/firefly/endpoint/getSwapActivityByHash.js';
import { captureShareIconClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';

interface SwapActionsProps {
    activity: SwapActivity;
    isDetail?: boolean;
}

export const SwapActions = memo<SwapActionsProps>(function SwapActions({ activity, isDetail = false }) {
    const isLogin = useIsLoginFirefly();
    const longShareUrl = useShareUrl(urlcat(SITE_URL, resolveTxPageUrl(activity.hash, activity.chain_id)));
    const { register } = useShortShareUrl(longShareUrl);

    const { data = activity } = useQuery({
        enabled: isDetail,
        queryKey: ['swap', activity?.hash, activity?.chain_id],
        queryFn: async () => {
            if (!activity) return;
            const data = await getSwapActivityByHash(activity.hash, activity.chain_id);
            return data;
        },
    });

    const [{ loading: handleMirrorLoading }, handleMirror] = useAsyncFn(async () => {
        if (!isLogin) {
            openLoginModalWithGuard();
            return;
        }

        const result = await openAndWaitForCloseComposeModal({
            type: 'compose',
            chars: [
                t`🔥 Spotted a smart swap on Firefly! One-tap copy trading now available. #OnChainSocial`,
                ' \n\n',
                longShareUrl,
            ],
        });

        if (result) {
            const repostResult = await createTxReaction(
                TxReactionType.ShareSwap,
                activity.chain_id.toString(),
                activity.hash,
                activity.owner,
            );

            if (repostResult) {
                queryClient.setQueryData(['swap', activity.hash, activity.chain_id], (old?: SwapActivity) => {
                    return {
                        ...(old || activity),
                        repost_count: (old?.repost_count || activity.repost_count || 0) + 1,
                        is_repost: true,
                    };
                });

                patchTransactionsQuery(Source.Swap, (data?: SwapActivity) => {
                    if (data?.hash === activity.hash) {
                        data.repost_count = data.repost_count + 1;
                        data.is_repost = true;
                    }
                });
            }
        }
    }, [isLogin, longShareUrl, activity]);

    return (
        <div className={classNames('mt-2 flex items-center justify-between gap-2')}>
            <SwapButton
                loginRequired
                className="!ml-0 flex items-center !gap-1 !rounded-lg bg-transparent !p-0 !text-[12px] !font-normal !leading-5 !text-commonWarn"
                swapProps={{
                    entry: SwapAccessPath.CopyTrade,
                    chainId: activity.chain_id,
                    fromToken: activity.from_token?.address,
                    toToken: activity.to_token?.address,
                    toChainId: activity.to_chain_id,
                }}
            >
                <LightningIcon width="28px" height="28px" className="rounded-full p-1 hover:bg-commonWarn/30" />
                <Trans>Buy</Trans>
            </SwapButton>
            <div className="flex items-center gap-5">
                <div
                    className={classNames('flex items-center gap-1 text-sm text-second', {
                        '!text-secondarySuccess': !!data?.is_repost,
                    })}
                >
                    <Tooltip placement="top" content={<Trans>Repost</Trans>}>
                        <ClickableButton
                            loading={handleMirrorLoading}
                            className="inline-flex size-7 items-center justify-center rounded-full text-second hover:bg-secondarySuccess/[.20] hover:text-secondarySuccess"
                            onClick={handleMirror}
                        >
                            <MirrorIcon
                                className={classNames('size-4', {
                                    'text-secondarySuccess': !!data?.is_repost,
                                })}
                            />
                        </ClickableButton>
                    </Tooltip>
                    {data?.repost_count && data.repost_count > 0 ? <span>{nFormatter(data.repost_count)}</span> : null}
                </div>
                {data ? <LikeButton type={Source.Swap} data={data} /> : null}

                <MoreActionMenu
                    buttonClassName="!text-second"
                    button={
                        <Tooltip placement="top" content={<Trans>Share</Trans>}>
                            <motion.div
                                onClick={() => captureShareIconClickEvent('Swap')}
                                whileTap={{ scale: 0.9 }}
                                className="inline-flex size-7 items-center justify-center rounded-full hover:bg-link/[0.2] hover:text-link disabled:opacity-60"
                            >
                                <ShareButtonWithAnimation />
                            </motion.div>
                        </Tooltip>
                    }
                >
                    <MenuGroup>
                        <MenuItem>{({ close }) => <CopyLinkButton getLink={register} onClick={close} />}</MenuItem>
                        <MenuItem>
                            {({ close }) => (
                                <MenuButton
                                    onClick={() => {
                                        close();
                                        openShareImageModal({
                                            imageUrl: urlcat(SITE_URL, 'api/og/swap/:chainId/:hash/image', {
                                                chainId: activity.chain_id,
                                                hash: activity.hash,
                                            }),
                                            aspectRatio: '432 / 226',
                                            fileName: 'firefly_swap_share.jpg',
                                            enableCopy: true,
                                            onPost: handleMirror,
                                        });
                                    }}
                                >
                                    <ShareImageIcon width={18} height={18} className="text-main" />
                                    <span className="font-bold leading-[22px] text-main">
                                        <Trans>Share Image</Trans>
                                    </span>
                                </MenuButton>
                            )}
                        </MenuItem>
                    </MenuGroup>
                </MoreActionMenu>
            </div>
        </div>
    );
});
