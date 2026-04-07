import { useState } from 'react';
import { useAsyncFn } from 'react-use';

export function useReportFeedback(
    name: string,
    comments: string,
    _options: { enqueueSuccessMessage?: boolean } = { enqueueSuccessMessage: true },
) {
    const [reported] = useState(false);

    const [{ loading }, handleReport] = useAsyncFn(async () => {
        return;
    }, []);

    return [reported, loading, handleReport] as const;
}
