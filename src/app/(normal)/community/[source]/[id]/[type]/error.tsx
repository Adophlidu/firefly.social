'use client';

import { ErrorHandler } from '@/components/ErrorHandler.js';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    return <ErrorHandler className="mt-20 !h-auto w-full" error={error} reset={reset} />;
}
