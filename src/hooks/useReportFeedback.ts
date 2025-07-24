import { useState } from 'react';
import { useAsyncFn } from 'react-use';

export function useReportFeedback(
    name: string,
    comments: string,
    options: { enqueueSuccessMessage?: boolean } = { enqueueSuccessMessage: true },
) {
    const [reported] = useState(false);

    const [{ loading }, handleReport] = useAsyncFn(async () => {
        return;
    }, [name, comments, options.enqueueSuccessMessage]);

    return [reported, loading, handleReport] as const;
}
