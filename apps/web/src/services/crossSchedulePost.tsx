import { SUPPORTED_FRAME_SOURCES } from '@dimensiondev/constants/computed';
import { Source } from '@dimensiondev/enums';
import { UnauthorizedError } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { ConnectorNotConnectedError } from '@wagmi/core';
import dayjs from 'dayjs';
import urlcat from 'urlcat';

import { DraftPageTab } from '@/components/Compose/DraftPage.js';
import { CreateScheduleError } from '@/constants/error.js';
import { openComposeModal } from '@/controllers/openComposeModal.js';
import { readChars } from '@/helpers/chars.js';
import { checkScheduleTime } from '@/helpers/checkScheduleTime.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getCompositePost } from '@/helpers/getCompositePost.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getPostMediaTypes } from '@/helpers/getPostMediaTypes.js';
import { resolveCreateSchedulePostPayload } from '@/helpers/resolveCreateSchedulePostPayload.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { commitPoll } from '@/providers/firefly/poll/commitPoll.js';
import { schedulePost } from '@/providers/firefly/post/schedulePost.js';
import { captureComposeSchedulePostEvent } from '@/providers/telemetry/captureComposeEvent.js';
import { captureCreateFarPollEvent } from '@/providers/telemetry/capturePollEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { ensureSchedulePostPassword } from '@/services/ensureSchedulePostPassword.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';
import type { ComposeType, CompositePost } from '@/types/compose.js';

export async function createSchedulePostsPayload(
    type: ComposeType,
    compositePost: CompositePost,
    isThread = false,
    signal?: AbortSignal,
) {
    const { updatePollId } = useComposeStateStore.getState();
    const { chars, poll, availableSources } = compositePost;

    if (poll && SUPPORTED_FRAME_SOURCES.some((x) => availableSources.includes(x))) {
        const pollId = await commitPoll(poll, readChars({ chars }));

        updatePollId(pollId);
        captureCreateFarPollEvent(pollId);
    }

    const updatedCompositePost = getCompositePost(compositePost.id);
    if (!updatedCompositePost) throw new Error(`Post not found with id: ${compositePost.id}`);

    return Promise.all(
        availableSources.map(async (x) => {
            const profile = getCurrentProfileFromStorage(x);
            if (!profile) throw new UnauthorizedError();
            const payload = await resolveCreateSchedulePostPayload(x)(type, updatedCompositePost, isThread, signal);

            return {
                platformUserId: profile.profileId,
                platform: resolveSocialSourceInUrl(x),
                payload,
            };
        }),
    );
}

export async function crossSchedulePost(
    type: ComposeType,
    compositePost: CompositePost,
    scheduleTime: Date,
    signal?: AbortSignal,
) {
    try {
        checkScheduleTime(scheduleTime);

        const password = await ensureSchedulePostPassword();
        if (!password) return;

        const posts = await createSchedulePostsPayload(type, compositePost, false, signal);

        if (compositePost.availableSources.includes(Source.Lens))
            await useLensProfileStore.getState().refreshCurrentAccount();

        const result = await schedulePost(
            scheduleTime,
            posts.map((x) => ({
                ...x,
                payload: JSON.stringify([x.payload]),
            })),
            {
                content: readChars({ chars: compositePost?.chars ?? '', strategy: 'visible' }),
                media_type: getPostMediaTypes(compositePost),
            },
        );
        if (!result) return;

        captureComposeSchedulePostEvent(EventId.COMPOSE_SCHEDULED_POST_CREATE_SUCCESS, compositePost, {
            scheduleId: result,
        });

        enqueueSuccessMessage(
            <span>
                <Trans>
                    Your post will be sent on {dayjs(scheduleTime).format('DD MMM, YYYY')} at{' '}
                    {dayjs(scheduleTime).format('hh:mm A')}{' '}
                    <span
                        className="cursor-pointer underline"
                        onClick={() => {
                            openComposeModal({
                                initialPath: urlcat('/draft', { tab: DraftPageTab.Scheduled }),
                            });
                        }}
                    >
                        View
                    </span>
                </Trans>
            </span>,
        );
    } catch (error) {
        if (error instanceof CreateScheduleError) {
            enqueueWarningMessage(error.message);
        } else {
            if (error instanceof ConnectorNotConnectedError) throw error;
            enqueueMessageFromError(error, <Trans>Failed to create schedule post.</Trans>);
        }
        throw error;
    }
}
