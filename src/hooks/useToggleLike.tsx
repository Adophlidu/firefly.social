import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';

import { PlatformId, Source, TxReactionType } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { updateQueryForLikeReaction } from '@/helpers/updateQueryForLikeReaction.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { createTxReaction } from '@/providers/firefly/endpoint/createTxReaction.js';
import { removeTxReaction } from '@/providers/firefly/endpoint/removeTxReaction.js';
import type { SnapshotActivity } from '@/providers/snapshot/type.js';
import { captureArticleLikeSuccessEvent } from '@/providers/telemetry/captureClickEvent.js';
import { type Article, ArticlePlatform } from '@/providers/types/Article.js';
import type { PolymarketActivity } from '@/providers/types/Firefly.js';

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
          type: Source.Polymarket;
          data: PolymarketActivity;
      };
interface LikeParams {
    reactionType: TxReactionType;
    platformId: PlatformId;
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
                platformId: PlatformId.Matters,
                reactionId,
                reactionOwnerId,
            };
        case ArticlePlatform.Mirror:
            return {
                reactionType: TxReactionType.LikeMirror,
                platformId: PlatformId.Mirror,
                reactionId,
                reactionOwnerId,
            };
        case ArticlePlatform.Paragraph:
            return {
                reactionType: TxReactionType.LikeParagraph,
                platformId: PlatformId.Paragraph,
                reactionId,
                reactionOwnerId,
            };
        case ArticlePlatform.Limo:
            return {
                reactionType: TxReactionType.LikeLimo,
                platformId: PlatformId.Limo,
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
                platformId: PlatformId.Others,
                reactionId: data.hash,
                reactionOwnerId: data.owner,
            };
        case Source.Polymarket:
            return {
                reactionType: TxReactionType.LikeBets,
                platformId: PlatformId.Others,
                reactionId: data.transactionHash,
                reactionOwnerId: data.owner,
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
        case Source.Polymarket:
            return liked ? <Trans>Polymarket liked.</Trans> : <Trans>Polymarket unliked.</Trans>;
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
        case Source.Polymarket:
            return liked ? <Trans>Failed to like polymarket.</Trans> : <Trans>Failed to unlike polymarket.</Trans>;
        default:
            safeUnreachable(type);
            return liked ? <Trans>Failed to like.</Trans> : <Trans>Failed to unlike.</Trans>;
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
                if (target.type === Source.Article) {
                    captureArticleLikeSuccessEvent(target.data.id);
                }

                enqueueSuccessMessage(getSuccessMessage(target.type, !isLiked));
            } catch (error) {
                enqueueMessageFromError(error, getErrorMessage(target.type, !isLiked));
                throw error;
            }
        },
    });
}
