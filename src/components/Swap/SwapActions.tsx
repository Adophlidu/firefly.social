'use client';

import { classNames } from '@dimensiondev/utils';
import { MenuItem } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import LikeIcon from '@/assets/like.svg';
import LikedIcon from '@/assets/liked.svg';
import MirrorIcon from '@/assets/mirror.svg';
import ShareIcon from '@/assets/share.svg';
import ShareImageIcon from '@/assets/share-image.svg';
import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { queryClient } from '@/configs/queryClient.js';
import { Source, TxReactionType } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { downloadImage } from '@/helpers/downloadImage.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { patchTransactionsQuery } from '@/helpers/patchTransactionsQuery.js';
import { resolveTxPageUrl } from '@/helpers/resolveTxPageUrl.js';
import { useChangeSwapLikeStatus } from '@/hooks/useChangeSwapLikeStatus.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { ComposeModalRef } from '@/modals/ComposeModal.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';

interface SwapActionsProps {
    activity: SwapActivity;
    isDetail?: boolean;
}

export const SwapActions = memo<SwapActionsProps>(function SwapActions({ activity, isDetail = false }) {
    const isLoginFirefly = useIsLoginFirefly();

    const { data = activity } = useQuery({
        enabled: isDetail,
        queryKey: ['swap', activity?.hash, activity?.chain_id],
        queryFn: async () => {
            if (!activity) return;
            const data = await fireflyEndpointProvider.getSwapActivityByHash(activity.hash, activity.chain_id);
            return data;
        },
    });

    const { mutate: onLikeChange, isPending } = useChangeSwapLikeStatus(data);

    const [{ loading: handleMirrorLoading }, handleMirror] = useAsyncFn(async () => {
        if (!isLoginFirefly) {
            openLoginModal();
            return;
        }

        const result = await ComposeModalRef.openAndWaitForClose({
            type: 'compose',
            chars: [
                t`🔥 Spotted a smart swap on Firefly! One-tap copy trading now available. #OnChainSocial`,
                ' \n\n',
                urlcat(SITE_URL, resolveTxPageUrl(activity.hash, activity.chain_id)),
            ],
        });

        if (result) {
            const repostResult = await fireflyEndpointProvider.createTxReaction(
                TxReactionType.ShareSwap,
                activity.chain_id.toString(),
                activity.hash,
                activity.owner,
            );

            if (repostResult) {
                queryClient.setQueryData(['swap', activity.hash, activity.chain_id], (old: SwapActivity) => {
                    return {
                        ...old,
                        repost_count: old.repost_count + 1,
                        is_repost: true,
                    };
                });

                patchTransactionsQuery(Source.Swap, (data) => {
                    if (data.hash === activity.hash) {
                        data.repost_count = data.repost_count + 1;
                        data.is_repost = true;
                    }
                });
            }
        }
    }, [activity.hash, activity.chain_id, activity.owner, isLoginFirefly]);

    return (
        <div className={classNames('mt-2 flex items-center justify-between gap-2')}>
            <SwapButton
                loginRequired
                className="!ml-0 flex !rounded-lg !px-2 !py-1 !text-[12px] !font-medium !leading-5"
                swapProps={{
                    chainId: activity.chain_id,
                    fromToken: activity.from_token?.address,
                    toToken: activity.to_token?.address,
                    toChainId: activity.to_chain_id,
                }}
            >
                <Trans>Copy Trade</Trans>
            </SwapButton>
            <div className="flex items-center gap-5">
                <div
                    className={classNames('flex items-center gap-1 text-sm text-second', {
                        '!text-secondarySuccess': !!data?.is_repost,
                    })}
                >
                    <ClickableButton loading={handleMirrorLoading} className="cursor-pointer" onClick={handleMirror}>
                        <MirrorIcon
                            className={classNames('size-4', {
                                'text-secondarySuccess': !!data?.is_repost,
                            })}
                        />
                    </ClickableButton>
                    {data?.repost_count && data.repost_count > 0 ? <span>{nFormatter(data.repost_count)}</span> : null}
                </div>
                <div
                    className={classNames('flex items-center gap-1 text-sm text-second', {
                        '!text-danger': !!data?.is_like,
                    })}
                >
                    <ClickableButton
                        className="cursor-pointer"
                        loading={isPending}
                        loadingSize={16}
                        onClick={() => {
                            onLikeChange();
                        }}
                    >
                        {data?.is_like ? <LikedIcon className="size-4" /> : <LikeIcon className="size-4" />}
                    </ClickableButton>
                    {data?.like_count && data.like_count > 0 ? <span>{nFormatter(data.like_count)}</span> : null}
                </div>

                <MoreActionMenu
                    buttonClassName="!text-second"
                    button={
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            className="inline-flex size-4 items-center justify-center rounded-full hover:bg-link/[0.2] hover:text-link disabled:opacity-60"
                        >
                            <ShareIcon className="size-4" />
                        </motion.div>
                    }
                >
                    <MenuGroup>
                        <MenuItem>
                            {({ close }) => (
                                <CopyLinkButton
                                    link={urlcat(SITE_URL, resolveTxPageUrl(activity.hash, activity.chain_id))}
                                    onClick={close}
                                />
                            )}
                        </MenuItem>
                        <MenuItem>
                            {({ close }) => (
                                <MenuButton
                                    onClick={() => {
                                        ConfirmModalRef.open({
                                            title: <Trans>Share Image</Trans>,
                                            content: (
                                                <Image
                                                    src={urlcat(SITE_URL, 'api/og/swap/:chainId/:hash/image', {
                                                        chainId: activity.chain_id,
                                                        hash: activity.hash,
                                                    })}
                                                    alt="swap-image"
                                                    width={432}
                                                    height={226}
                                                    className="h-[226px] w-[432px]"
                                                />
                                            ),
                                            enableCancelButton: false,
                                            confirmButtonText: <Trans>Download</Trans>,
                                            onConfirm: () => {
                                                try {
                                                    downloadImage(
                                                        urlcat(SITE_URL, 'api/og/swap/:chainId/:hash/image', {
                                                            chainId: activity.chain_id,
                                                            hash: activity.hash,
                                                        }),
                                                        'firefly_swap_share.jpg',
                                                    );
                                                } catch (error) {
                                                    enqueueMessageFromError(error, 'Failed to download image');
                                                }
                                            },
                                            variant: 'normal',
                                            modalStyle: {
                                                width: 480,
                                            },
                                        });
                                        close();
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
