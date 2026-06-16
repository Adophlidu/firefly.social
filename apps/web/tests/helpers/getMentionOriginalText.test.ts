import { $createAutoLinkNode, AutoLinkNode, LinkNode } from '@lexical/link';
import { $createParagraphNode, $createTextNode, $getRoot, createEditor, type LexicalEditor } from 'lexical';
import { describe, expect, it } from 'vitest';

import { getSafeMentionQueryText } from '@/helpers/getMentionOriginalText.js';

/** Headless editor with `build` committed synchronously so state is readable. */
function buildEditor(build: () => void): LexicalEditor {
    const editor = createEditor({
        nodes: [AutoLinkNode, LinkNode],
        onError: (error) => {
            throw error;
        },
    });
    editor.update(build, { discrete: true });

    return editor;
}

describe('getSafeMentionQueryText', () => {
    // Caret inside a highlighted @name link → surface the AutoLinkNode.
    it('returns the AutoLinkNode when the caret is inside a highlighted @mention', () => {
        const editor = buildEditor(() => {
            const link = $createAutoLinkNode('');
            const innerText = $createTextNode('@vitalik');
            link.append(innerText);
            $getRoot().append($createParagraphNode().append(link));
            innerText.selectEnd();
        });

        const result = getSafeMentionQueryText('', editor, false);

        expect(result?.text).toBe('@vitalik');
        expect(result?.matchedNode).toBeDefined();
    });

    it('returns text without matchedNode for a plain (un-linked) @mention', () => {
        const editor = buildEditor(() => {
            const innerText = $createTextNode('@vitalik');
            $getRoot().append($createParagraphNode().append(innerText));
            innerText.selectEnd();
        });

        const result = getSafeMentionQueryText('', editor, false);

        expect(result?.text).toBe('@vitalik');
        expect(result?.matchedNode).toBeUndefined();
    });

    it('passes the raw text through while a mention tag is being inserted (isUpdating)', () => {
        const editor = buildEditor(() => {
            $getRoot().append($createParagraphNode());
        });

        expect(getSafeMentionQueryText('@partial', editor, true)).toEqual({ text: '@partial' });
    });
});
