import { useCallback, useRef, useState } from 'react';
import { useCopyToClipboard } from 'usehooks-ts';

export function useCopyText(text: string) {
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const [copied, setCopied] = useState(false);
    const [, copyToClipboard] = useCopyToClipboard();

    const handleCopy = useCallback(
        (immediateText?: string) => {
            copyToClipboard(immediateText ?? text);
            setCopied(true);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(setCopied, 1500, false);
        },
        [text, copyToClipboard],
    );

    return [copied, handleCopy] as const;
}
