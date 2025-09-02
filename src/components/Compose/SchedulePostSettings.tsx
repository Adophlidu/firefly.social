import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { noop } from 'lodash-es';
import { memo, useRef, useState } from 'react';
import { useAsyncFn, useClickAway } from 'react-use';

import CalendarIcon from '@/assets/calendar.svg';
import TimerIcon from '@/assets/timer.svg';
import { DatePicker } from '@/components/Calendar/DatePicker.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { TimePicker } from '@/components/TimePicker.js';
import { queryClient } from '@/configs/queryClient.js';
import { PasswordStep, PasswordWorkflow, Source } from '@/constants/enum.js';
import { CreateScheduleError, TokenExpiredError } from '@/constants/error.js';
import { checkScheduleTime } from '@/helpers/checkScheduleTime.js';
import { enqueueMessageFromError, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { LensSession } from '@/providers/lens/Session.js';
import { captureComposeSchedulePostEvent } from '@/providers/telemetry/captureComposeEvent.js';
import type { ScheduleTask } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { uploadMetrics } from '@/services/metrics.js';
import { updateScheduledPost } from '@/services/post.js';
import { verifyAndGetPassword } from '@/services/verifyAndGetPassword.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

interface SchedulePostSettingsProps {
    task?: ScheduleTask;
    action: 'create' | 'update';
    onClose: () => void;
}

export const SchedulePostSettings = memo<SchedulePostSettingsProps>(function SchedulePostSetting({
    task,
    action,
    onClose,
}) {
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [timePickerOpen, setTimePickerOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);
    const timePickerRef = useRef<HTMLDivElement>(null);

    useClickAway(datePickerRef, () => setDatePickerOpen(false));
    useClickAway(timePickerRef, () => setTimePickerOpen(false));

    const { disableSource } = useComposeStateStore();
    const { updateScheduleTime, clearScheduleTime, scheduleTime } = useComposeScheduleStateStore();
    const { currentProfile: currentLensProfile } = useLensProfileStore();

    const [value, setValue] = useState(task ? dayjs(task.schedule_at).toDate() : (scheduleTime ?? new Date()));

    const [{ loading }, handleSet] = useAsyncFn(async () => {
        try {
            if (dayjs(value).isBefore(new Date(), 'minute')) {
                enqueueWarningMessage(<Trans>The scheduled time has passed. Please reset.</Trans>);
                return;
            }

            const password = await verifyAndGetPassword({
                requireSetPassword: true,
                descriptions: {
                    [`${PasswordWorkflow.Verify}-${PasswordStep.VerifyPassword}`]: (
                        <Trans>
                            Multi-device login is required for schedule post. Enter your password to confirm your
                            identity.
                        </Trans>
                    ),
                    [`${PasswordWorkflow.Set}-${PasswordStep.SetPassword}`]: (
                        <Trans>
                            Multi-device login is required for schedule post. Set a 6-digit password to verify your
                            identity.
                        </Trans>
                    ),
                },
            });
            if (!password) return;

            await useLensProfileStore.getState().refreshCurrentAccount();
            await uploadMetrics(password);

            if (task) {
                checkScheduleTime(value);
                const result = await updateScheduledPost(task.task_uuid, value);
                if (!result) return;
                queryClient.refetchQueries({
                    queryKey: ['schedule-tasks', fireflySessionHolder.session?.profileId],
                });
                captureComposeSchedulePostEvent(EventId.COMPOSE_SCHEDULED_POST_UPDATE_SUCCESS, null, {
                    scheduleId: task.task_uuid,
                });
            } else {
                updateScheduleTime(value);
            }

            onClose();
        } catch (error) {
            if (error instanceof TokenExpiredError && currentLensProfile) {
                const state = getProfileState(Source.Lens);
                state.removeAccount({
                    profile: currentLensProfile,
                    session: state.currentProfileSession as LensSession,
                });
                disableSource(Source.Lens);
                enqueueWarningMessage(<Trans>This Lens account has expired, please log in again.</Trans>);
                return;
            }

            if (error instanceof CreateScheduleError) {
                enqueueWarningMessage(error.message);
            } else {
                enqueueMessageFromError(error, <Trans>Failed to set schedule time.</Trans>);
            }
            throw error;
        }
    }, [value, task, onClose, updateScheduleTime, currentLensProfile]);

    return (
        <div className="flex-col px-4 py-2 pb-6 text-main max-md:px-0 max-md:pb-2">
            <div className="text-center text-medium leading-[18px]">
                <Trans>The scheduled time to send this post can be set up to 7 days in advance.</Trans>
            </div>
            <div className="flex gap-2 pt-3 md:gap-4">
                <div ref={datePickerRef} className="flex w-full flex-1 items-center justify-center">
                    <div
                        className="flex w-full cursor-pointer gap-3 rounded-2xl bg-bg px-4 py-3 text-main"
                        onClick={() => setDatePickerOpen(!datePickerOpen)}
                    >
                        <CalendarIcon />
                        <span className="max-md:text-sm">{dayjs(value).format('MMM D')}</span>
                    </div>
                    <DatePicker
                        className="max-md:-top-[120px]"
                        open={datePickerOpen}
                        onToggle={setDatePickerOpen}
                        date={value}
                        onChange={(date) => setValue(date)}
                        onMonthChange={noop}
                        allowedDates={Array.from({ length: 8 }, (_, i) =>
                            dayjs().add(i, 'day').toDate().toLocaleDateString(),
                        )}
                    />
                </div>

                <div ref={timePickerRef} className="flex w-full flex-1 items-center justify-center">
                    <div
                        className="flex w-full cursor-pointer gap-3 rounded-2xl bg-bg px-4 py-3 text-main"
                        onClick={() => setTimePickerOpen(!timePickerOpen)}
                    >
                        <TimerIcon />
                        <span className="max-md:text-sm">{dayjs(value).format('hh:mm A')}</span>
                    </div>
                    <TimePicker open={timePickerOpen} onToggle={setTimePickerOpen} value={value} onChange={setValue} />
                </div>
            </div>

            <div className="flex gap-[6px] pt-3 max-md:flex-col">
                {action === 'create' ? (
                    <ClickableButton
                        loading={loading}
                        onClick={handleSet}
                        className="flex flex-1 items-center justify-center rounded-full bg-main py-2 font-bold text-primaryBottom"
                    >
                        <Trans>Set</Trans>
                    </ClickableButton>
                ) : (
                    <>
                        {!task && action === 'update' ? (
                            <ClickableButton
                                onClick={() => {
                                    clearScheduleTime();
                                    onClose();
                                }}
                                className="flex flex-1 items-center justify-center rounded-full border border-lightMain py-2 font-bold text-fourMain"
                            >
                                <Trans>Clear</Trans>
                            </ClickableButton>
                        ) : null}
                        <ClickableButton
                            loading={loading}
                            onClick={handleSet}
                            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-main py-2 font-bold text-primaryBottom"
                            disabled={task?.schedule_at ? dayjs(task.schedule_at).isSame(value) : false}
                        >
                            <Trans>Update</Trans>
                        </ClickableButton>
                    </>
                )}
            </div>
        </div>
    );
});
