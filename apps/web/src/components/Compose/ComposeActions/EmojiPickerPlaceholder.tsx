import { memo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';

export const EmojiPickerPlaceholder = memo(function EmojiPickerPlaceholder() {
    return (
        <div className="flex h-[300px] w-[350px] max-w-full items-center justify-center rounded-lg bg-[#222222] md:max-w-none">
            <LoadingIcon />
        </div>
    );
});
