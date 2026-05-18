import { ArticlePlatform, Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';

import { ArticlePlatformId, ExtraLikeType, TxReactionType } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { updateQueryForLikeReaction } from '@/helpers/updateQueryForLikeReaction.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { createTxReaction } from '@/providers/firefly/endpoint/createTxReaction.js';
import { removeTxReaction } from '@/providers/firefly/endpoint/removeTxReaction.js';
import type { SnapshotActivity } from '@/providers/snapshot/type.js';
import { captureArticleLikeSuccessEvent } from '@/providers/telemetry/captureClickEvent.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import type { Article } from '@/providers/types/Article.js';
import type { BetsActivity, SwapActivity, TipsLikeStatusData } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';

export type LikeTarget =
    | {
          type: Source.Article;
          data: Article;
      }
    | {
          type: Source.DAOs;
          data: SnapshotActivity;
      }
    | {
          type: Source.Prediction;
          data: BetsActivity;
      }
    | {
          type: Source.Swap;
          data: SwapActivity;
      }
    | {
          type: ExtraLikeType.Tips;
          data: TipsLikeStatusData;
      };

interface LikeParams {
    reactionType: TxReactionType;
    platformId: ArticlePlatformId | string;
    reactionId: string;
    reactionOwnerId: string;
}

function resolveArticleParams(article: Article) {
    const { platform } = article;
    const reactionId = article.id;
    const reactionOwnerId = article.author.id;

    switch (platform) {
        case ArticlePlatform.Matters:
            return {
                reactionType: TxReactionType.LikeMatters,
                platformId: ArticlePlatformId.Matters,
                reactionId,
                reactionOwnerId,
            };
        case ArticlePlatform.Mirror:
            return {
                reactionType: TxReactionType.LikeMirror,
                platformId: ArticlePlatformId.Mirror,
                reactionId,
                reactionOwnerId,
            };
        case ArticlePlatform.Paragraph:
            return {
                reactionType: TxReactionType.LikeParagraph,
                platformId: ArticlePlatformId.Paragraph,
                reactionId,
                reactionOwnerId,
            };
        case ArticlePlatform.Limo:
            return {
                reactionType: TxReactionType.LikeLimo,
                platformId: ArticlePlatformId.Limo,
                reactionId,
                reactionOwnerId,
            };
        default:
            safeUnreachable(platform);
            return undefined;
    }
}
function resolveLikeParams({ type, data }: LikeTarget): LikeParams | undefined {
    switch (type) {
        case Source.Article:
            return resolveArticleParams(data);
        case Source.DAOs:
            return {
                reactionType: TxReactionType.LikeDAO,
                platformId: ArticlePlatformId.Others,
                reactionId: data.hash,
                reactionOwnerId: data.owner,
            };
        case Source.Prediction:
            return {
                reactionType: TxReactionType.LikeBets,
                platformId: ArticlePlatformId.Others,
                reactionId: data.transactionHash,
                reactionOwnerId: data.owner,
            };
        case Source.Swap:
            return {
                reactionType: TxReactionType.LikeSwap,
                platformId: data.chain_id.toString(),
                reactionId: data.hash,
                reactionOwnerId: data.owner,
            };
        case ExtraLikeType.Tips:
            return {
                reactionType: TxReactionType.LikeTip,
                platformId: data.chainId.toString(),
                reactionId: data.txHash,
                reactionOwnerId: data.fromAddress,
            };
        default:
            safeUnreachable(type);
            return undefined;
    }
}
function getSuccessMessage(type: LikeTarget['type'], liked: boolean) {
    switch (type) {
        case Source.Article:
            return liked ? <Trans>Article liked.</Trans> : <Trans>Article unliked.</Trans>;
        case Source.DAOs:
            return liked ? <Trans>Snapshot liked.</Trans> : <Trans>Snapshot unliked.</Trans>;
        case Source.Prediction:
            return liked ? <Trans>Prediction liked.</Trans> : <Trans>Prediction unliked.</Trans>;
        case Source.Swap:
            return liked ? <Trans>Swap liked.</Trans> : <Trans>Swap unliked.</Trans>;
        case ExtraLikeType.Tips:
            return liked ? <Trans>Tip liked.</Trans> : <Trans>Tip unliked.</Trans>;
        default:
            safeUnreachable(type);
            return liked ? <Trans>Liked.</Trans> : <Trans>Unliked.</Trans>;
    }
}
function getErrorMessage(type: LikeTarget['type'], liked: boolean) {
    switch (type) {
        case Source.Article:
            return liked ? <Trans>Failed to like article.</Trans> : <Trans>Failed to unlike article.</Trans>;
        case Source.DAOs:
            return liked ? <Trans>Failed to like snapshot.</Trans> : <Trans>Failed to unlike snapshot.</Trans>;
        case Source.Prediction:
            return liked ? <Trans>Failed to like prediction.</Trans> : <Trans>Failed to unlike prediction.</Trans>;
        case Source.Swap:
            return liked ? <Trans>Failed to like swap.</Trans> : <Trans>Failed to unlike swap.</Trans>;
        case ExtraLikeType.Tips:
            return liked ? <Trans>Failed to like tip.</Trans> : <Trans>Failed to unlike tip.</Trans>;
        default:
            safeUnreachable(type);
            return liked ? <Trans>Failed to like.</Trans> : <Trans>Failed to unlike.</Trans>;
    }
}
function captureLikeEvent({ type, data }: LikeTarget, liked: boolean) {
    switch (type) {
        case Source.Article:
            return captureArticleLikeSuccessEvent(data.id);
        case Source.Swap:
            return liked ? captureSwapEvent(EventId.EVENT_LIKE_SWAP_CLICK) : undefined;
        case Source.DAOs:
        case Source.Prediction:
        case ExtraLikeType.Tips:
            return;
        default:
            safeUnreachable(type);
            return;
    }
}

export function useToggleLike(target: LikeTarget) {
    const isLoginFirefly = useIsLoginFirefly();
    const likeParams = resolveLikeParams(target);

    return useMutation({
        mutationKey: [target.type, likeParams?.reactionType, likeParams?.platformId, likeParams?.reactionId],
        mutationFn: async (isLiked: boolean) => {
            if (!isLoginFirefly) {
                openLoginModal();
                return;
            }
            if (!likeParams) return;

            try {
                if (isLiked) {
                    await removeTxReaction(likeParams.reactionType, [likeParams.reactionId]);
                } else {
                    await createTxReaction(
                        likeParams.reactionType,
                        likeParams.platformId.toString(),
                        likeParams.reactionId,
                        likeParams.reactionOwnerId,
                    );
                }

                // update query
                updateQueryForLikeReaction(target, isLiked);

                // capture event
                captureLikeEvent(target, !isLiked);

                enqueueSuccessMessage(getSuccessMessage(target.type, !isLiked));
            } catch (error) {
                enqueueMessageFromError(error, getErrorMessage(target.type, !isLiked));
                throw error;
            }
        },
    });
}
