import { t } from '@lingui/core/macro';
import type { HTMLProps } from 'react';

import type { FrameInput } from '@/types/frame.js';

interface Props extends HTMLProps<HTMLInputElement> {
    input: FrameInput;
}

export function Input({ input, ...rest }: Props) {
    return (
        <input
            {...rest}
            className="w-full rounded-md border border-line bg-white px-2 py-1.5 dark:bg-darkBottom dark:text-white"
            type="text"
            autoComplete="off"
            spellCheck="false"
            placeholder={input.label || t`Type something here...`}
        />
    );
}
