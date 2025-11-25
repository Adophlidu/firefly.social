import { useState } from 'react';
import { useAsyncFn } from 'react-use';

import { sentryClient } from '@/configs/sentryClient.js';
import { ExceptionId } from '@/providers/types/Telemetry.js';

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
    const [reported] = useState(false);

    const [{ loading }, handleReport] = useAsyncFn(async () => {
        sentryClient.captureException(options.exceptionId, {
            name,
            comments,
        });
        return;
    }, [comments, name, options.exceptionId]);

    return [reported, loading, handleReport] as const;
}
