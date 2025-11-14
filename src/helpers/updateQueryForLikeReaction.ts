import { safeUnreachable } from '@dimensiondev/utils';
import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { patchTransactionsQuery } from '@/helpers/patchTransactionsQuery.js';
import type { LikeTarget } from '@/hooks/useToggleLike.js';
import type { SnapshotActivity } from '@/providers/snapshot/type.js';
import { type Article } from '@/providers/types/Article.js';
import type { PolymarketActivity, SwapActivity } from '@/providers/types/Firefly.js';

function updateQueryForArticle(article: Article, isLiked: boolean) {
    queryClient.setQueryData<Article>(['article', article.id], (old) => {
        if (!old) return old;
        return produce(old, (draft) => {
            draft.isLiked = !isLiked;
            draft.likeCount = (article.likeCount || 0) + (isLiked ? -1 : 1);
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
                            oldData.isLiked = !isLiked;
                            oldData.likeCount = (oldData.likeCount || 0) + (isLiked ? -1 : 1);
                        }
                    });
                });
            });
        },
    );

    queryClient.setQueryData<Article>(['article-detail', article.id], (old) => {
        if (!old) return old;

        return produce(old, (draft) => {
            draft.isLiked = !isLiked;
            draft.likeCount = (draft.likeCount || 0) + (isLiked ? -1 : 1);
        });
    });
}
function updateQueryForSnapshot(activity: SnapshotActivity, isLiked: boolean) {
    queryClient.setQueriesData<{
        pages: Array<{ data: any[] }>;
    }>(
        {
            queryKey: ['activities'],
        },
        (old) => {
            if (!old) return old;

            return produce(old, (draft) => {
                draft.pages.forEach((page) => {
                    page.data.forEach((item: any) => {
                        if (item.source === 'DAOs' && item.data?.hash === activity.hash) {
                            item.data.isLiked = !isLiked;
                            item.data.likeCount = (item.data.likeCount || 0) + (isLiked ? -1 : 1);
                        }
                    });
                });
            });
        },
    );

    queryClient.setQueriesData<{
        pages: Array<{ data: SnapshotActivity[] }>;
    }>(
        {
            queryKey: ['snapshots'],
        },
        (old) => {
            if (!old) return old;

            return produce(old, (draft) => {
                draft.pages.forEach((page) => {
                    page.data.forEach((oldData: SnapshotActivity) => {
                        if (oldData.hash === activity.hash) {
                            oldData.isLiked = !isLiked;
                            oldData.likeCount = (oldData.likeCount || 0) + (isLiked ? -1 : 1);
                        }
                    });
                });
            });
        },
    );
}
function updateQueryForPolymarket(activity: PolymarketActivity, isLiked: boolean) {
    queryClient.setQueriesData<{
        pages: Array<{ data: PolymarketActivity[] }>;
    }>(
        {
            queryKey: ['polymarket'],
        },
        (old) => {
            if (!old?.pages) return old;

            return produce(old, (draft) => {
                draft.pages.forEach((page) => {
                    page.data.forEach((oldData: PolymarketActivity) => {
                        if (oldData.transactionHash === activity.transactionHash) {
                            oldData.isLiked = !isLiked;
                            oldData.likeCount = (activity.likeCount || 0) + (isLiked ? -1 : 1);
                        }
                    });
                });
            });
        },
    );
}
function updateQueryForSwap(activity: SwapActivity, isLiked: boolean) {
    queryClient.setQueriesData<{
        pages: Array<{ data: SwapActivity[] }>;
    }>(
        {
            queryKey: ['swaps'],
        },
        (old) => {
            if (!old) return old;

            return produce(old, (draft) => {
                draft.pages.forEach((page) => {
                    page.data.forEach((oldData) => {
                        if (oldData.hash === activity.hash) {
                            oldData.is_like = !isLiked;
                            oldData.like_count = oldData.like_count + (isLiked ? -1 : 1);
                        }
                    });
                });
            });
        },
    );

    patchTransactionsQuery(Source.Swap, (data) => {
        if (data.hash === activity.hash) {
            data.is_like = !isLiked;
            data.like_count = data.like_count + (isLiked ? -1 : 1);
        }
    });

    queryClient.setQueryData<SwapActivity>(['swap', activity.hash, activity.chain_id], (old) => {
        if (!old) return old;

        return produce(old, (draft) => {
            draft.is_like = !isLiked;
            draft.like_count = draft.like_count + (isLiked ? -1 : 1);
        });
    });
}

export function updateQueryForLikeReaction(target: LikeTarget, isLiked: boolean) {
    switch (target.type) {
        case Source.Article:
            return updateQueryForArticle(target.data, isLiked);
        case Source.DAOs:
            return updateQueryForSnapshot(target.data, isLiked);
        case Source.Polymarket:
            return updateQueryForPolymarket(target.data, isLiked);
        case Source.Swap:
            return updateQueryForSwap(target.data, isLiked);
        default:
            safeUnreachable(target);
            return;
    }
}
