import { Source } from '@dimensiondev/enums';
import { memo } from 'react';

import { LikeButton } from '@/components/Actions/LikeButton.js';
import { ActivityCellSnapshotAction } from '@/components/ActivityCell/Snapshot/ActivityCellSnapshotAction.js';
import { CollapsedContent } from '@/components/Posts/CollapsedContent.js';
import { SingleSnapshotHeader } from '@/components/Snapshot/SingleSnapshotHeader.js';
import { SnapshotActions } from '@/components/Snapshot/SnapshotActions.js';
import { SnapshotBody } from '@/components/Snapshot/SnapshotBody.js';
import { SnapshotFallbackContent } from '@/components/Snapshot/SnapshotFallbackContent.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { formatSnapshotChoice } from '@/helpers/formatSnapshotChoice.js';
import type { SnapshotActivity, SnapshotProposal } from '@/providers/snapshot/type.js';

function getProposalLink(proposal: SnapshotProposal) {
    return `https://snapshot.box/#/s:${proposal.space.id}/proposal/${proposal.id}`;
}

interface SingleSnapshotProps {
    data: SnapshotActivity;
}

export const SingleSnapshot = memo<SingleSnapshotProps>(function SingleSnapshot({ data }) {
    const isMuted = data.author.isMuted;

    const label = data.proposal ? formatSnapshotChoice(data.choice, data.proposal.type, data.proposal.choices) : null;

    return (
        <article
            className={'border-line hover:bg-bg border-b bg-bottom px-3 py-2 max-md:px-4 max-md:py-3 md:px-4 md:py-3'}
        >
            <SingleSnapshotHeader data={data} />
            {isMuted ? (
                <CollapsedContent className="mt-2 pl-[52px]" authorMuted isQuote={false} />
            ) : (
                <div className="-mt-2 pl-[52px]">
                    <ActivityCellSnapshotAction>
                        <TextOverflowTooltip className="max-sm:block" placement="top-start" content={label}>
                            <span className="truncate">{label}</span>
                        </TextOverflowTooltip>
                    </ActivityCellSnapshotAction>

                    {data.proposal ? (
                        <div>
                            <SnapshotBody activity={data} snapshot={data.proposal} />
                        </div>
                    ) : (
                        <SnapshotFallbackContent {...data.fallback_content} />
                    )}

                    <footer className="mt-3 flex items-center justify-between">
                        <LikeButton type={Source.DAOs} data={data} />
                        <SnapshotActions activity={data} link={data.proposal ? getProposalLink(data.proposal) : ''} />
                    </footer>
                </div>
            )}
        </article>
    );
});
