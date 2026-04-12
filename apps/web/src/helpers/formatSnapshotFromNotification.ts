import { SnapshotState } from '@/constants/enum.js';
import type { SnapshotActivity, SnapshotProposal } from '@/providers/snapshot/type.js';
import type { UnifiedNotification } from '@/providers/types/Firefly.js';

export function formatSnapshotActivityFromNotification(data: UnifiedNotification['data']): SnapshotActivity | null {
    if (!data?.id || !data.hash || !data.owner) return null;

    const proposal: SnapshotProposal | undefined = data.proposal
        ? {
              id: data.proposal_id || '',
              title: data.proposal.title || '',
              body: data.proposal.body || '',
              author: data.proposal.author || '',
              choices: data.proposal.choices || [],
              start: Number.parseInt(data.proposal.start || '0', 10),
              end: Number.parseInt(data.proposal.end || '0', 10),
              scores: data.proposal.scores || [],
              scores_by_strategy: [],
              scores_total: (data.proposal.scores || []).reduce((sum: number, score: number) => sum + score, 0),
              scores_updated: 0,
              created: 0,
              snapshot: 0,
              state: SnapshotState.Active,
              symbol: '',
              votes: 0,
              type: 'basic',
              quorum: 0,
              plugins: {},
              network: '',
              strategies: [],
              link: data.related_urls?.[0] || '',
              space: {
                  id: data.proposal.organization?.id || '',
                  name: data.proposal.organization?.name || '',
              },
          }
        : undefined;

    return {
        id: data.id,
        hash: data.hash,
        owner: data.owner,
        type: data.type || 'vote',
        timestamp: data.timestamp ? Number.parseInt(data.timestamp, 10) * 1000 : Date.now(),
        choice: data.choice,
        proposal_id: data.proposal_id || '',
        related_urls: data.related_urls || [],
        hasBookmarked: data.hasBookmarked || false,
        author: {
            id: data.author?.id || data.owner,
            handle: data.author?.handle || '',
            avatar: data.author?.avatar || '',
            isFollowing: data.author?.isFollowing || false,
            isMuted: data.author?.isMuted || false,
        },
        isLiked: data.isLiked || false,
        likeCount: data.likeCount || 0,
        displayInfo: {
            ensHandle: data.author?.handle || '',
            avatarUrl: data.author?.avatar || '',
        },
        fallback_content: {
            title: data.fallback_content?.title || '',
            body: data.fallback_content?.body || '',
        },
        proposal,
    } as SnapshotActivity;
}
