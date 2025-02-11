// @ts-expect-error
import linkifyRegex from 'remark-linkify-regex';

import { URL_REGEX } from '@/constants/regexp.js';

type Position = Record<'start' | 'end', Record<'line' | 'column' | 'offset', number>>;

interface TextNode {
    type: 'text';
    value: string;
    children?: AstNode[];
}
interface LinkNode {
    type: 'link';
    url: string;
    title: string;
    children?: AstNode[];
}
type AstNode = TextNode | LinkNode;

interface AstRoot {
    type: 'root' | 'paragraph';
    children: AstNode[];
    position: Position;
}

function removeMentionFromLink(nodes: AstNode[]) {
    return nodes.map((node, index) => {
        const prevNode = nodes[index - 1];
        if (
            node.type === 'link' &&
            !node.url.startsWith('http') &&
            prevNode?.type === 'text' &&
            prevNode.value.endsWith('@')
        ) {
            return {
                type: 'text',
                value: node.title,
            } satisfies TextNode;
        }
        if (node.children?.length) {
            node.children = removeMentionFromLink(node.children);
        }

        return node;
    });
}

export function UrlPlugin() {
    return (ast: AstRoot) => {
        const root: AstRoot = linkifyRegex(URL_REGEX)()(ast);
        if (root.children.length) {
            root.children = removeMentionFromLink(root.children);
        }
        return root;
    };
}
