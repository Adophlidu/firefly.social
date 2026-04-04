import { $isAutoLinkNode, type AutoLinkNode } from '@lexical/link';
import { $getSelection, $isRangeSelection, type LexicalEditor, type RangeSelection } from 'lexical';

import { MENTION_REGEX } from '@/constants/regexp.js';

interface QueryText {
    text: string;
    matchedNode?: AutoLinkNode;
}

function getTextUpToAnchor(selection: RangeSelection): QueryText | null {
    const anchor = selection.anchor;
    if (anchor.type !== 'text') {
        return null;
    }

    const anchorNode = anchor.getNode();
    if (!anchorNode.isSimpleText()) {
        return null;
    }

    const anchorOffset = anchor.offset;
    const prevSibling = anchorNode.getPreviousSibling();
    const prevSiblingText = prevSibling?.getTextContent() ?? '';
    MENTION_REGEX.lastIndex = 0;

    const isMention = MENTION_REGEX.test(anchorNode.getTextContent());

    if (isMention) {
        return {
            text: anchorNode.getTextContent(),
        };
    }

    if (anchorOffset === 0 && $isAutoLinkNode(prevSibling) && MENTION_REGEX.test(prevSiblingText)) {
        return { text: prevSiblingText, matchedNode: prevSibling };
    }
    return null;
}

function getQueryTextForSearch(editor: LexicalEditor): QueryText | null {
    let text = null;
    editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            return;
        }
        text = getTextUpToAnchor(selection);
    });
    return text;
}

export function getSafeMentionQueryText(text: string, editor: LexicalEditor, isUpdating: boolean) {
    if (isUpdating) return { text };
    return getQueryTextForSearch(editor);
}
