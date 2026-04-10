import { runInSafeAsync, safeUnreachable, UnreachableError } from '@dimensiondev/utils';
import dayjs from 'dayjs';

import { getComposeEventParameters, type Options } from '@/providers/telemetry/getComposeEventParameters.js';
import { getPostEventId, getPostEventParameters } from '@/providers/telemetry/getPostEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { type ComposeType, type CompositePost } from '@/types/compose.js';

function getTimeParameters(date = new Date()) {
    const offset = new Date().getTimezoneOffset();
    return `${dayjs(date).format('MM-DD-YYYY HH:mm:ss')}(GMT${offset < 0 ? '+' : '-'}${Math.abs(offset / 60)})`;
}

export function captureComposeDraftPostEvent(
    eventId: EventId.COMPOSE_DRAFT_CREATE_SUCCESS,
    post: CompositePost,
    options: Options = {},
) {
    return runInSafeAsync(async () => {
        const date = new Date();

        const draftId = options.draftId;
        if (!draftId) throw new Error('Draft ID is missing.');

        return TelemetryProvider.captureEvent(eventId, {
            draft_id: draftId,
            draft_time: date.getTime(),
            draft_time_utc: getTimeParameters(date),
            ...getComposeEventParameters(post, {
                draftId,
                thread: options.thread,
            }),
        });
    });
}

export function captureComposeSchedulePostEvent(
    eventId:
        | EventId.COMPOSE_SCHEDULED_POST_CREATE_SUCCESS
        | EventId.COMPOSE_SCHEDULED_POST_DELETE_SUCCESS
        | EventId.COMPOSE_SCHEDULED_POST_UPDATE_SUCCESS,
    post: CompositePost | null,
    options: Options = {},
) {
    return runInSafeAsync(async () => {
        const date = new Date();

        const scheduleId = options.scheduleId;
        if (!scheduleId) throw new Error('Schedule ID is missing.');

        switch (eventId) {
            case EventId.COMPOSE_SCHEDULED_POST_DELETE_SUCCESS:
                return TelemetryProvider.captureEvent(eventId, {
                    schedule_id: scheduleId,
                    schedule_time: date.getTime(),
                    scheduled_time_utc: getTimeParameters(date),
                });
            case EventId.COMPOSE_SCHEDULED_POST_UPDATE_SUCCESS:
                return TelemetryProvider.captureEvent(eventId, {
                    schedule_id: scheduleId,
                    new_schedule_time: date.getTime(),
                    new_scheduled_time_utc: getTimeParameters(date),
                });
            case EventId.COMPOSE_SCHEDULED_POST_CREATE_SUCCESS:
                if (!post) throw new Error('Post is missing.');
                return TelemetryProvider.captureEvent(eventId, {
                    schedule_id: scheduleId,
                    schedule_time: date.getTime(),
                    scheduled_time_utc: getTimeParameters(date),
                    ...getComposeEventParameters(post, {
                        scheduleId,
                    }),
                });
            default:
                safeUnreachable(eventId);
                throw new UnreachableError('eventId', eventId);
        }
    });
}

export function captureComposeEvent(type: ComposeType, post: CompositePost, options: Options = {}) {
    const capture = async () => {
        const size = post.availableSources.length;

        // post created
        {
            // the default social source
            const source = post.availableSources[0];

            // post to only one platform
            if (size === 1) {
                switch (type) {
                    case 'compose':
                        await TelemetryProvider.captureEvent(
                            getPostEventId(type, source, post),
                            getComposeEventParameters(post, options),
                        );
                        return;
                    case 'reply':
                    case 'quote': {
                        const parentPost = Object.values(post.parentPost).find((x) => x);
                        if (!parentPost) throw new Error(`Parent post is missing.`);

                        await TelemetryProvider.captureEvent(
                            getPostEventId(type, source, post),
                            getPostEventParameters(parentPost),
                        );
                        return;
                    }
                    default:
                        safeUnreachable(type);
                        throw new UnreachableError('type', type);
                }

                // crossed post
            } else if (size > 1) {
                await Promise.allSettled(
                    post.availableSources.map(async (x) => {
                        await TelemetryProvider.captureEvent(
                            getPostEventId(type, x, post),
                            getComposeEventParameters(post, options),
                        );
                    }),
                );
                await TelemetryProvider.captureEvent(
                    EventId.COMPOSE_CROSS_POST_SEND_SUCCESS,
                    getComposeEventParameters(post, {
                        ...options,
                        isCrossQuote: type === 'quote',
                    }),
                );
                return;
            }

            throw new Error('Invalid post size.');
        }
    };

    return runInSafeAsync(capture);
}

export function captureComposeCrossAtEvent(eventId: EventId.COMPOSE_CROSS_AT_EDIT_SUCCESS) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(eventId, {});
    });
}
