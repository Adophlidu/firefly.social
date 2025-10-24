import { Trans } from '@lingui/react/macro';
import { memo, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { type SocialSource } from '@/constants/enum.js';
import { WalletAddressMismatchError } from '@/constants/error.js';
import { POLL_CHOICE_TYPE } from '@/constants/poll.js';
import { classNames } from '@/helpers/classNames.js';
import {
    enqueueErrorMessage,
    enqueueMessageFromError,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolvePollProvider } from '@/helpers/resolvePollProvider.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Poll, PollOption } from '@/providers/types/Poll.js';
import { useOrbPollResultStore } from '@/store/useOrbPollResultStore.js';

interface VoteButtonPanelProps {
    source: SocialSource;
    postId: string;
    poll: Poll;
}

export const VoteButtonPanel = memo<VoteButtonPanelProps>(function VoteButtonPanel({ source, postId, poll }) {
    const currentProfile = useCurrentProfile(source);
    const [selectedId, setSelectedId] = useState<string>();
    const [selectedOptions, setSelectedOptions] = useState<PollOption[]>([]);
    const { addPollResult } = useOrbPollResultStore();

    const profileId = currentProfile?.profileId;
    const isMultiple = poll.type === POLL_CHOICE_TYPE.Multiple;
    const [{ loading }, handleVote] = useAsyncFn(
        async (option?: PollOption) => {
            try {
                if (!profileId) {
                    openLoginModal({ source });
                    return;
                }

                if (!option && !selectedOptions.length) return;
                if (isMultiple && option) {
                    setSelectedOptions((prev) => {
                        return prev.some((x) => x.id === option.id)
                            ? prev.filter((x) => x.id !== option.id)
                            : [...prev, option];
                    });
                    return;
                }

                const options = isMultiple ? selectedOptions : option ? [option] : [];
                if (!options.length) {
                    enqueueErrorMessage(<Trans>No selected choice.</Trans>);
                    return;
                }

                setSelectedId(option?.id);
                const pollProvider = resolvePollProvider(source);
                const res = await pollProvider.vote({
                    postId,
                    pollId: poll.id,
                    frameUrl: '',
                    options,
                    allOptions: poll.options,
                });
                enqueueSuccessMessage(
                    res.is_success ? <Trans>Your vote is in!</Trans> : <Trans>Failed to vote.</Trans>,
                );
                runInSafe(() =>
                    addPollResult(
                        profileId,
                        postId,
                        options.map((option) => option.id),
                    ),
                );
            } catch (error) {
                if (error instanceof WalletAddressMismatchError) {
                    enqueueWarningMessage(
                        <Trans>Please switch to the wallet associated with your Lens account for signature.</Trans>,
                    );
                    return;
                }

                enqueueMessageFromError(
                    error,
                    <Trans>Failed to vote.{error instanceof Error ? ` ${error.message}` : ''}</Trans>,
                );
                throw error;
            }
        },
        [isMultiple, selectedOptions, poll.id, postId, source, profileId, poll.options, addPollResult],
    );

    return (
        <div>
            {poll.options.map((option, index) => (
                <ClickableButton
                    key={`${option.id}-${index}`}
                    disabled={loading}
                    className={classNames(
                        'mt-3 flex h-10 w-full items-center justify-center rounded-[10px] border text-base font-bold leading-10 hover:border-lightHighlight hover:text-highlight disabled:!cursor-default disabled:!opacity-100',
                        selectedOptions.some((x) => x.id === option.id)
                            ? 'border-lightHighlight text-highlight'
                            : 'border-lightMain text-lightMain',
                    )}
                    onClick={() => handleVote(option)}
                >
                    {loading && !isMultiple && option.id === selectedId ? <LoadingIcon /> : option.label}
                </ClickableButton>
            ))}
            {isMultiple && selectedOptions.length ? (
                <ClickableButton
                    className="mt-3 h-10 w-full rounded-full bg-main text-sm font-bold text-primaryBottom"
                    loading={loading}
                    onClick={() => handleVote()}
                >
                    <Trans>Vote</Trans>
                </ClickableButton>
            ) : null}
        </div>
    );
});
