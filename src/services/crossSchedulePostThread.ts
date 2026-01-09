import { delay } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { ConnectorNotConnectedError } from '@wagmi/core';
import { first } from 'lodash-es';

import { type SocialSourceInURL, Source } from '@/constants/enum.js';
import { CreateScheduleError } from '@/constants/error.js';
import { readChars } from '@/helpers/chars.js';
import { checkScheduleTime } from '@/helpers/checkScheduleTime.js';
import {
    enqueueMessageFromError,
    enqueueSuccessMessage,
    enqueueWarningMessage,
    MessageKey,
} from '@/helpers/enqueueMessage.js';
import { getPostMediaTypes } from '@/helpers/getPostMediaTypes.js';
import { type SchedulePayload } from '@/helpers/resolveCreateSchedulePostPayload.js';
import { schedulePost } from '@/providers/firefly/post/schedulePost.js';
import { captureComposeSchedulePostEvent } from '@/providers/telemetry/captureComposeEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { createSchedulePostsPayload } from '@/services/crossSchedulePost.js';
import { ensureSchedulePostPassword } from '@/services/ensureSchedulePostPassword.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

export async function crossPostScheduleThread(scheduleTime: Date, signal?: AbortSignal) {
    try {
        const { posts, type } = useComposeStateStore.getState();
        if (posts.length === 1) throw new Error('A thread must have at least two posts.');

        checkScheduleTime(scheduleTime);

        const password = await ensureSchedulePostPassword();
        if (!password) return;

        const results = new Map<
            SocialSourceInURL,
            { platform: SocialSourceInURL; platformUserId: string; payload: SchedulePayload[] }
        >();

        for (const [index, post] of posts.entries()) {
            const payload = await createSchedulePostsPayload(index === 0 ? 'compose' : 'reply', post, true, signal);
            payload.forEach((x) => {
                const origin = results.get(x.platform);
                results.set(x.platform, {
                    ...x,
                    payload: origin ? [...origin.payload, x.payload] : [x.payload],
                });
            });
            await delay(1000);
        }

        const postsPayload = [...results.values()];

        const post = first(posts);
        const content = readChars(post?.chars ?? '', 'visible');

        if (post?.availableSources.includes(Source.Lens)) await useLensProfileStore.getState().refreshCurrentAccount();

        const result = await schedulePost(
            scheduleTime,
            postsPayload.map((x) => ({
                ...x,
                payload: JSON.stringify(x.payload),
            })),
            {
                content,
                media_type: getPostMediaTypes(post),
            },
        );
        if (!result) return;

        if (post) {
            captureComposeSchedulePostEvent(EventId.COMPOSE_SCHEDULED_POST_CREATE_SUCCESS, post, {
                thread: posts,
                scheduleId: result,
            });
        }

        enqueueSuccessMessage(t`Your schedule thread has created successfully.`);
    } catch (error) {
        if (error instanceof CreateScheduleError) {
            enqueueWarningMessage(error.message);
        } else {
            if (error instanceof ConnectorNotConnectedError) throw error;
            enqueueMessageFromError(error, t`Failed to create schedule thread posts.`, {
                key: MessageKey.COMPOSE_ERROR_NOTIFICATION_KEY,
            });
        }
        throw error;
    }
}
