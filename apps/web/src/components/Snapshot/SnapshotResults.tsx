'use client';

import { Trans } from '@lingui/react/macro';
import { memo, Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { SnapshotVotesList } from '@/components/Snapshot/SnapshotVotesList.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { SnapshotState } from '@/constants/enum.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatPercentage } from '@/helpers/formatPercentage.js';

interface SnapshotResultsProps {
    status: SnapshotState;
    choices: string[];
    scores: number[];
    symbol: string;
    scoreTotal: number;
    id: string;
    votes: number;
}

export const SnapshotResults = memo<SnapshotResultsProps>(function SnapshotResults({
    status,
    choices,
    scores,
    symbol,
    scoreTotal,
    id,
    votes,
}) {
    return (
        <div className="no-scrollbar flex flex-col overflow-auto max-md:h-[270px] md:h-[374px]">
            <div className="text-main text-base font-bold">
                {status === SnapshotState.Closed ? <Trans>Results</Trans> : <Trans>Current Results</Trans>}
            </div>
            <div className="bg-farcasterBg mt-2 flex flex-col gap-2 rounded-lg p-4">
                {choices.map((choice, index) => {
                    const score = scores[index] || 0;
                    return (
                        <div key={index}>
                            <div className="flex items-center justify-between">
                                <TextOverflowTooltip className="max-sm:block" placement="top" content={choice}>
                                    <div className="text-main truncate">{choice}</div>
                                </TextOverflowTooltip>
                                <div className="text-main flex gap-1 whitespace-nowrap">
                                    <span>{score > 1 ? nFormatter(score) : score.toFixed(2)}</span>
                                    <span>{symbol}</span>
                                    <span>{scoreTotal ? formatPercentage(score / scoreTotal) : '0%'}</span>
                                </div>
                            </div>
                            <div className="bg-bg03 mt-2 h-2 w-full rounded">
                                <div
                                    className="bg-lightHighlight h-full rounded"
                                    style={{
                                        width: `${
                                            scoreTotal
                                                ? ((score / scoreTotal) * 100)
                                                      .toFixed(2)
                                                      .replace(/(\.\d*?)0+$/, '$1')
                                                      .replace(/\.$/, '')
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-main mb-2 mt-4 flex gap-1 text-base font-bold">
                <Trans>Votes</Trans>
                <span className="text-secondary">({votes.toLocaleString('en-US')})</span>
            </div>

            <Suspense fallback={<Loading className="h-auto !min-h-0 flex-1" />}>
                <SnapshotVotesList id={id} />
            </Suspense>
        </div>
    );
});
