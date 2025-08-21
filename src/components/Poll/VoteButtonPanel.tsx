import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { type SocialSource } from '@/constants/enum.js';
import { POLL_CHOICE_TYPE } from '@/constants/poll.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolvePollProvider } from '@/helpers/resolvePollProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import type { Poll, PollOption } from '@/providers/types/Poll.js';

interface VoteButtonPanelProps {
    source: SocialSource;
    postId: string;
    poll: Poll;
}

export const VoteButtonPanel = memo<VoteButtonPanelProps>(function VoteButtonPanel({ source, postId, poll }) {
    const isLogin = useIsLogin(source);
    const [selectedId, setSelectedId] = useState<string>();
    const [selectedOptions, setSelectedOptions] = useState<PollOption[]>([]);

    const isMultiple = poll.type === POLL_CHOICE_TYPE.Multiple;
    const [{ loading }, handleVote] = useAsyncFn(
        async (option?: PollOption) => {
            try {
                if (!isLogin) {
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
                    enqueueErrorMessage(t`No selected choice.`);
                    return;
                }

                setSelectedId(option?.id);
                const pollProvider = resolvePollProvider(source);
                const res = await pollProvider.vote({
                    postId,
                    pollId: poll.id,
                    frameUrl: '',
                    options,
                });
                enqueueSuccessMessage(res.is_success ? t`Voted successfully.` : t`Failed to vote.`);
            } catch (error) {
                enqueueMessageFromError(error, t`Failed to vote.`);
                throw error;
            }
        },
        [isMultiple, selectedOptions, poll.id, postId, source, isLogin],
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
