import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { $getSelection, $isRangeSelection } from 'lexical';
import { useEffect } from 'react';

import { addSharerParamToFireflyUrls } from '@/helpers/sharerUrl.js';
import { useCurrentFireflyAccountUID } from '@/hooks/useCurrentFireflyAccountUID.js';

export function SharerLinkPastePlugin() {
    const [editor] = useLexicalComposerContext();
    const sharerId = useCurrentFireflyAccountUID();

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            if (!sharerId) return;

            const clipboardData = event.clipboardData;
            if (!clipboardData) return;
            if ([...clipboardData.items].some((item) => item.kind === 'file')) return;

            const pastedText = clipboardData.getData('text/plain');
            if (!pastedText) return;

            const nextText = addSharerParamToFireflyUrls(pastedText, sharerId);
            if (nextText === pastedText) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            let inserted = false;
            editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                selection.insertText(nextText);
                inserted = true;
            });

            if (!inserted) return;
        };

        return editor.registerRootListener((rootElement, prevRootElement) => {
            prevRootElement?.removeEventListener('paste', handlePaste, true);
            rootElement?.addEventListener('paste', handlePaste, true);
        });
    }, [editor, sharerId]);

    return null;
}
