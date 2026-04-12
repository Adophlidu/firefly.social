import { safeUnreachable } from '@dimensiondev/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { $createParagraphNode, $createTextNode, $getRoot, type ParagraphNode } from 'lexical';
import { useCallback } from 'react';

import { $createMentionNode } from '@/components/Lexical/nodes/MentionsNode.js';
import { CharTag } from '@/constants/enum.js';
import type { Chars, ComplexChars } from '@/types/chars.js';

function updateParagraphNode(paragraphNode: ParagraphNode, chars: ComplexChars) {
    const { tag, visible } = chars;
    if (!visible) return;

    switch (tag) {
        case CharTag.FIREFLY_RP:
            paragraphNode.append($createTextNode(`${chars.content}\n`));
            break;
        case CharTag.FRAME:
            break;
        case CharTag.MENTION:
            paragraphNode.append($createMentionNode(chars.content, chars.profiles));
            break;
        case CharTag.PROMOTE_LINK:
        case CharTag.POST_LINK:
            paragraphNode.append($createTextNode(chars.content));
            break;
        default:
            safeUnreachable(tag);
            break;
    }
}

export function useSetEditorContent() {
    const [editor] = useLexicalComposerContext();
    return useCallback(
        (content: string | Chars) => {
            editor.update(() => {
                const root = $getRoot();
                const paragraphNode = $createParagraphNode();
                if (typeof content === 'string') {
                    const textNode = $createTextNode(content);
                    paragraphNode.append(textNode);
                    root.clear();
                    root.append(paragraphNode);
                    root.selectEnd();
                } else {
                    for (const x of content) {
                        if (typeof x === 'string') {
                            paragraphNode.append($createTextNode(x));
                        } else {
                            updateParagraphNode(paragraphNode, x);
                        }
                    }

                    root.clear();
                    root.append(paragraphNode);
                    root.selectEnd();
                }
            });
        },
        [editor],
    );
}
