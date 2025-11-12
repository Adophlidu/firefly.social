import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';
import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { PlatformId, TxReactionType } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { createTxReaction } from '@/providers/firefly/endpoint/createTxReaction.js';
import { removeTxReaction } from '@/providers/firefly/endpoint/removeTxReaction.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { captureArticleLikeSuccessEvent } from '@/providers/telemetry/captureClickEvent.js';
import type { Article } from '@/providers/types/Article.js';
import { ArticlePlatform } from '@/providers/types/Article.js';

function getReactionParams(article: Article) {
    const { platform } = article;

    const reactionId = article.id;
    const reactionOwnerId = article.author.id;

    switch (platform) {
        case ArticlePlatform.Matters:
            return {
                reactionType: TxReactionType.LikeMatters,
                platformId: PlatformId.Matters.toString(),
                reactionId,
                reactionOwnerId,
            };
        case ArticlePlatform.Mirror:
            return {
                reactionType: TxReactionType.LikeMirror,
                platformId: PlatformId.Mirror.toString(),
                reactionId,
                reactionOwnerId,
            };
        case ArticlePlatform.Paragraph:
            return {
                reactionType: TxReactionType.LikeParagraph,
                platformId: PlatformId.Paragraph.toString(),
                reactionId,
                reactionOwnerId,
            };
        case ArticlePlatform.Limo:
            return {
                reactionType: TxReactionType.LikeLimo,
                platformId: PlatformId.Limo.toString(),
                reactionId,
                reactionOwnerId,
            };
    }
}

function updateQueries(article: Article) {
    queryClient.setQueryData<Article>(['article', article.id], (old) => {
        if (!old) return old;
        return produce(old, (draft) => {
            draft.isLiked = !article.isLiked;
            draft.likeCount = (article.likeCount || 0) + (article.isLiked ? -1 : 1);
        });
    });

    queryClient.setQueriesData<{
        pages: Array<{ data: Article[] }>;
    }>(
        {
            queryKey: ['articles'],
        },
        (old) => {
            if (!old) return old;

            return produce(old, (draft) => {
                draft.pages.forEach((page) => {
                    page.data.forEach((oldData) => {
                        if (oldData.id === article.id) {
                            oldData.isLiked = !article.isLiked;
                            oldData.likeCount = (oldData.likeCount || 0) + (article.isLiked ? -1 : 1);
                        }
                    });
                });
            });
        },
    );

    queryClient.setQueryData<Article>(['article-detail', article.id], (old) => {
        if (!old) return old;

        return produce(old, (draft) => {
            draft.isLiked = !article.isLiked;
            draft.likeCount = (draft.likeCount || 0) + (article.isLiked ? -1 : 1);
        });
    });
}

export function useToggleArticleLike() {
    return useMutation({
        mutationFn: async (article: Article) => {
            if (!fireflySessionHolder.session) {
                openLoginModal();
                return;
            }
            const { isLiked } = article;
            const params = getReactionParams(article);

            try {
                let result;
                if (isLiked) {
                    result = await removeTxReaction(params.reactionType, [params.reactionId]);
                    enqueueSuccessMessage(t`Article unliked`);
                } else {
                    result = await createTxReaction(
                        params.reactionType,
                        params.platformId,
                        params.reactionId,
                        params.reactionOwnerId,
                    );
                    enqueueSuccessMessage(t`Article liked`);
                    captureArticleLikeSuccessEvent(article.id, fireflySessionHolder.session.profileId);
                }
                updateQueries(article);
            } catch (error) {
                enqueueMessageFromError(error, isLiked ? t`Failed to unlike article.` : t`Failed to like article.`);
                throw error;
            }
        },
    });
}
