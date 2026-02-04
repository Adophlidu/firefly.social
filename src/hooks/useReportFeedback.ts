import { delay } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { logger } from '@/libs/Logger.js';
import { ExceptionId } from '@/providers/errorCapture/captureException.js';
import { reportException } from '@/providers/firefly/report/reportException.js';

interface Options {
    enqueueSuccessMessage?: boolean;
    exceptionId: ExceptionId;
}

export function useReportFeedback(
    name: string,
    comments: string,
    options: Options = {
        enqueueSuccessMessage: true,
        exceptionId: ExceptionId.USER_REPORT,
    },
) {
    const [reported, setReported] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const [{ loading }, handleReport] = useAsyncFn(async () => {
        try {
            setReported(false);
            await reportException({
                message: name,
                stack_trace: comments,
                exception_type: options.exceptionId,
                severity: 'error',
            });
            await delay(1000);
            setReported(true);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(setReported, 1500, false);
            if (options.enqueueSuccessMessage) enqueueSuccessMessage(t({ id: 'error-reported', message: 'Reported' }));
        } catch (error) {
            logger.error('[useReportFeedback] failed to report feedback', error);
            setReported(false);
        }
    }, [comments, name, options.enqueueSuccessMessage, options.exceptionId]);

    return [reported, loading, handleReport] as const;
}
