import { t } from '@lingui/core/macro';
import { captureMessage, captureUserFeedback } from '@sentry/browser';
import { useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { delay } from '@/helpers/delay.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';

export function useReportFeedback(
    name: string,
    comments: string,
    options: { enqueueSuccessMessage?: boolean } = { enqueueSuccessMessage: true },
) {
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const [reported, setReported] = useState(false);

    const [{ loading }, handleReport] = useAsyncFn(async () => {
        captureUserFeedback({
            event_id: captureMessage(name),
            name,
            comments,
            email: 'report_to_sentry',
        });
        await delay(1000);
        setReported(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(setReported, 1500, false);
        if (options.enqueueSuccessMessage) enqueueSuccessMessage(t`Reported`);
    }, [name, comments, options.enqueueSuccessMessage]);

    return [reported, loading, handleReport] as const;
}
