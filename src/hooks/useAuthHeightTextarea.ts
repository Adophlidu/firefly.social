import { useLayoutEffect } from 'react';

export function useAuthHeightTextarea(getElement: () => HTMLTextAreaElement | undefined | null) {
    useLayoutEffect(() => {
        const textareaEl = getElement();
        if (!textareaEl) return;
        function adjustTextareaHeight() {
            if (!textareaEl) return;
            textareaEl.style.height = '1px';
            textareaEl.style.height = `${textareaEl.scrollHeight}px`;
        }
        adjustTextareaHeight();
        textareaEl.addEventListener('input', adjustTextareaHeight);
        textareaEl.addEventListener('change', adjustTextareaHeight);
        textareaEl.addEventListener('focus', adjustTextareaHeight);
        textareaEl.addEventListener('blur', adjustTextareaHeight);
        return () => {
            textareaEl.removeEventListener('input', adjustTextareaHeight);
            textareaEl.removeEventListener('change', adjustTextareaHeight);
            textareaEl.removeEventListener('focus', adjustTextareaHeight);
            textareaEl.removeEventListener('blur', adjustTextareaHeight);
        };
    }, [getElement]);
}
