import { classNames } from '@dimensiondev/utils';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { isArray, isEqual, isNumber, isObject, isUndefined, last, sum, values } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';
import { getAddress } from 'viem';
import { useConnection } from 'wagmi';

import SnapshotIcon from '@/assets/snapshot.svg';
import { Avatar } from '@/components/Avatar.js';
import { ChainGuardButton } from '@/components/ChainGuardButton.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Link } from '@/components/Link.js';
import { SnapshotMarkup } from '@/components/Markup/SnapshotMarkup.js';
import { Time } from '@/components/Semantic/Time.js';
import { SnapshotApprovalChoices } from '@/components/Snapshot/SnapshotApprovalChoices.js';
import { SnapshotQuadraticChoices } from '@/components/Snapshot/SnapshotQuadraticChoices.js';
import { SnapshotRankChoices } from '@/components/Snapshot/SnapshotRankChoices.js';
import { SnapshotResults } from '@/components/Snapshot/SnapshotResults.js';
import { SnapshotSingleChoices } from '@/components/Snapshot/SnapshotSingleChoices.js';
import { SnapshotStatus } from '@/components/Snapshot/SnapshotStatus.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { queryClient } from '@/configs/queryClient.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';
import { SnapshotState, SourceInURL } from '@/constants/enum.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { formatSnapshotChoice } from '@/helpers/formatSnapshotChoice.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import { getVotePower } from '@/providers/snapshot/getVotePower.js';
import { pathQueryVoteResultsByVoter } from '@/providers/snapshot/pathQueryVoteResultsByVoter.js';
import type { SnapshotActivity, SnapshotChoice, SnapshotProposal } from '@/providers/snapshot/type.js';
import { vote } from '@/providers/snapshot/vote.js';
import { captureSnapshotVoteEvent } from '@/providers/telemetry/captureSnapshotVoteEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';

interface Props {
    activity?: SnapshotActivity;
    snapshot: SnapshotProposal;
    link?: string;
    postId?: string;
    showVote?: boolean;
}

export function SnapshotBody({ snapshot, link, postId, activity, showVote = true }: Props) {
    const { choices, scores, symbol, scores_total, votes, space, author } = snapshot;
    const [currentTabIndex, setCurrentTabIndex] = useState(0);

    const authorUrl = urlcat('/profile/:address', {
        address: snapshot.author,
        source: SourceInURL.Wallet,
    });

    const tabs = [
        {
            label: <Trans>Proposal</Trans>,
            value: 'proposal',
        },
        {
            label: <Trans>Votes</Trans>,
            value: 'votes',
        },
    ] as const;

    const ensHandle = useEnsName(author);

    const state =
        snapshot.state === SnapshotState.Closed
            ? snapshot.type !== 'basic'
                ? SnapshotState.Closed
                : SnapshotState.Passed
            : snapshot.state;
    return (
        <div>
            <ClickableArea className="relative mt-[6px] flex flex-col gap-2 rounded-2xl border border-line bg-bg p-3 text-left text-commonMain">
                <SnapshotStatus status={state} className="self-start" />
                <h3
                    className={classNames('line-clamp-2 text-left text-[20px] font-bold leading-[22px] text-main', {
                        'max-h-[40px]': IS_SAFARI && IS_APPLE,
                    })}
                >
                    {snapshot.title}
                </h3>
                <div>
                    <div className="flex items-center gap-2 max-md:flex md:hidden">
                        <Link href={authorUrl} className="z-1">
                            <Avatar
                                className="size-[15px]"
                                src={`https://cdn.stamp.fyi/space/s:${space.id}?s=40`}
                                size={15}
                                alt={space.name || space.id}
                            />
                        </Link>
                        <Link
                            href={authorUrl}
                            onClick={stopPropagation}
                            className="block truncate text-medium leading-5 text-secondary"
                        >
                            <Trans>
                                <strong>{space.name}</strong> by{' '}
                                <strong>{ensHandle.data || formatAddressEthereum(snapshot.author, 4)}</strong>
                            </Trans>
                        </Link>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-1 items-center gap-2 truncate">
                            <div className="hidden items-center gap-2 md:flex">
                                <Link href={authorUrl} className="z-1">
                                    <Avatar
                                        className="size-[15px]"
                                        src={`https://cdn.stamp.fyi/space/s:${space.id}?s=40`}
                                        size={15}
                                        alt={space.name || space.id}
                                    />
                                </Link>
                                <Link
                                    href={authorUrl}
                                    onClick={stopPropagation}
                                    className="block truncate text-medium leading-5 text-secondary"
                                >
                                    <Trans>
                                        <strong>{space.name}</strong> by{' '}
                                        <strong>{ensHandle.data || formatAddressEthereum(snapshot.author, 4)}</strong>
                                    </Trans>
                                </Link>
                            </div>
                            <Time
                                dateTime={snapshot.created * 1000}
                                className="truncate whitespace-nowrap text-medium leading-4 text-secondary"
                            >
                                <TimestampFormatter time={snapshot.created * 1000} />
                            </Time>
                            ·
                            <SnapshotIcon width={15} height={15} />
                        </div>
                    </div>
                </div>

                <div>
                    <TabGroup selectedIndex={currentTabIndex} onChange={setCurrentTabIndex}>
                        <TabList className="flex w-full rounded-t-xl bg-none">
                            {tabs.map((x, i) => (
                                <Tab
                                    className={classNames(
                                        'flex-1 rounded-t-xl px-4 py-2 text-base font-bold leading-5 outline-none',
                                        {
                                            'text-secondary': currentTabIndex !== i,
                                            'bg-primaryBottom text-main': currentTabIndex === i,
                                        },
                                    )}
                                    key={x.value}
                                >
                                    {x.label}
                                </Tab>
                            ))}
                        </TabList>
                        <TabPanels className="rounded-b-xl bg-primaryBottom p-4">
                            <TabPanel>
                                <SnapshotMarkup className="no-scrollbar overflow-auto text-sm leading-[18px] text-secondary max-md:h-[270px] md:h-[374px]">
                                    {snapshot.body}
                                </SnapshotMarkup>
                            </TabPanel>
                            <TabPanel>
                                <SnapshotResults
                                    status={state}
                                    choices={choices}
                                    scores={scores}
                                    symbol={symbol}
                                    scoreTotal={scores_total}
                                    id={snapshot.id}
                                    votes={votes}
                                />
                            </TabPanel>
                        </TabPanels>
                    </TabGroup>
                </div>
                {showVote ? <SnapshotVote link={link} postId={postId} activity={activity} snapshot={snapshot} /> : null}
            </ClickableArea>
        </div>
    );
}

function SnapshotVote({ link, postId, snapshot }: Props) {
    const { choices, type, state } = snapshot;
    const [selectedChoices, setSelectedChoices] = useState<SnapshotChoice | undefined>();
    const account = useConnection();
    const { data: currentUserChoice, isLoading: isLoadingCurrentUserChoice } = useQuery({
        queryKey: ['snapshot-votes', snapshot.id, account.address],
        async queryFn() {
            if (!account.address) return null;
            const votes = await pathQueryVoteResultsByVoter([snapshot.id], account.address);
            const target = last(votes.data);
            if (!target) return null;
            return target.choice;
        },
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        initialData: snapshot.currentUserChoice,
        enabled: !!account.address,
    });

    const isVoted =
        !isUndefined(selectedChoices) && !isUndefined(currentUserChoice) && isEqual(currentUserChoice, selectedChoices);

    const { data: vp, isLoading: queryVpLoading } = useQuery({
        queryKey: [
            'snapshot',
            account.address,
            snapshot.network,
            snapshot.strategies,
            snapshot.snapshot,
            snapshot.space.id,
        ],
        queryFn: async () => {
            if (!account.address) return 0;
            const { vp } = await getVotePower(
                account.address,
                snapshot.network,
                snapshot.strategies,
                snapshot.snapshot,
                snapshot.space.id,
                false,
            );

            return vp;
        },
    });

    useEffect(() => {
        if (currentUserChoice) setSelectedChoices(currentUserChoice);
    }, [currentUserChoice]);

    const isPending = state === SnapshotState.Pending;
    const isNotEnoughVp = vp === 0 && !queryVpLoading;

    const disabled = useMemo(() => {
        if (!selectedChoices || (isArray(selectedChoices) && !selectedChoices?.length) || isNotEnoughVp) return true;

        if (type === 'approval' && isArray(selectedChoices) && !selectedChoices.length) return true;

        if (
            (type === 'quadratic' || type === 'weighted') &&
            isObject(selectedChoices) &&
            sum(values(selectedChoices)) === 0
        )
            return true;

        if (type === 'ranked-choice' && isArray(selectedChoices) && selectedChoices.length !== choices.length)
            return true;

        return false;
    }, [type, selectedChoices, choices, isNotEnoughVp]);

    const [{ loading: isVoting }, handleVote] = useAsyncFn(async () => {
        try {
            if (!account.address || disabled || !selectedChoices) return;

            captureSnapshotVoteEvent(EventId.SNAPSHOT_VOTE_SUBMIT, account.address);
            const result = await vote({
                from: getAddress(account.address),
                space: snapshot.space.id,
                proposal: snapshot.id,
                type: snapshot.type,
                choice: selectedChoices,
                privacy: snapshot.privacy,
                app: 'snapshot',
                reason: '',
            });
            captureSnapshotVoteEvent(EventId.SNAPSHOT_VOTE_SUCCESS, account.address);

            if (!result) return;

            const confirmed = await ConfirmModalRef.openAndWaitForClose({
                title: <Trans>Your vote is in!</Trans>,
                content: (
                    <div className="mb-2 text-center text-medium leading-[18px] text-secondary">
                        <Trans>
                            Create a post to tell everyone about your participation. Votes can be changed while the
                            proposal is active.
                        </Trans>
                    </div>
                ),
                contentClass: 'pt-0',
                modalClass: '!max-w-[388px] !w-[388px]',
                variant: 'secondary',
                enableConfirmButton: true,
                confirmButtonText: <Trans>Create a Post</Trans>,
            });

            if (confirmed) {
                const choice = formatSnapshotChoice(selectedChoices, type, choices);
                openComposeModal({
                    type: 'compose',
                    chars: [
                        choice
                            ? t`🙌 Just voted “${choice}” on “${snapshot.title}”`
                            : t`🙌 Just voted on “${snapshot.title}”`,
                        `\n\n${snapshot.link}`,
                    ],
                });
            }

            if (link && postId) {
                queryClient.refetchQueries({
                    queryKey: ['post-embed', link, postId],
                });
            }
            queryClient.setQueriesData({ queryKey: ['snapshot-votes', snapshot.id, account.address] }, selectedChoices);
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to vote.</Trans>);
            throw error;
        }
    }, [
        account.address,
        disabled,
        selectedChoices,
        snapshot.space.id,
        snapshot.id,
        snapshot.type,
        snapshot.privacy,
        snapshot.title,
        snapshot.link,
        link,
        postId,
        type,
        choices,
    ]);

    const handleChange = useCallback((value?: SnapshotChoice) => {
        if (!isUndefined(value)) {
            setSelectedChoices(value);
        }
    }, []);

    if (state !== SnapshotState.Active && state !== SnapshotState.Pending) return null;

    return (
        <>
            {type === 'single-choice' || type === 'basic' ? (
                <SnapshotSingleChoices
                    value={!isUndefined(selectedChoices) && isNumber(selectedChoices) ? selectedChoices : undefined}
                    choices={choices}
                    disabled={isPending}
                    onChange={handleChange}
                />
            ) : null}
            {type === 'approval' ? (
                <SnapshotApprovalChoices
                    value={!isUndefined(selectedChoices) && isArray(selectedChoices) ? selectedChoices : undefined}
                    choices={snapshot.choices}
                    disabled={isPending}
                    onChange={handleChange}
                />
            ) : null}
            {type === 'quadratic' || type === 'weighted' ? (
                <SnapshotQuadraticChoices
                    value={
                        !isUndefined(selectedChoices) && !isArray(selectedChoices) && isObject(selectedChoices)
                            ? selectedChoices
                            : undefined
                    }
                    choices={choices}
                    disabled={isPending}
                    onChange={handleChange}
                />
            ) : null}
            {type === 'ranked-choice' ? (
                <SnapshotRankChoices
                    value={!isUndefined(selectedChoices) && isArray(selectedChoices) ? selectedChoices : undefined}
                    choices={choices}
                    disabled={isPending}
                    onChange={handleChange}
                />
            ) : null}
            <ChainGuardButton
                className="w-full"
                variant={isVoted || isNotEnoughVp ? 'secondary' : 'primary'}
                disabled={disabled || isVoted}
                loading={queryVpLoading || isLoadingCurrentUserChoice || isVoting}
                onClick={handleVote}
            >
                {isVoted ? <Trans>Voted</Trans> : isNotEnoughVp ? <Trans>No voting power</Trans> : <Trans>Vote</Trans>}
            </ChainGuardButton>
        </>
    );
}
