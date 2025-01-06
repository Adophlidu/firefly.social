import { memo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';

export const LoadingStatus = memo(function LoadingStatus() {
    return (
        <div className="flex flex-col items-center justify-center p-[2px]">
            <LoadingIcon />
        </div>
    );
});
