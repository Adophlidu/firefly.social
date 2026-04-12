import { compact } from 'lodash-es';
import type { PhrasingContent, Root, RootContent, Text } from 'mdast';
import linkifyRegex from 'remark-linkify-regex';

import { URL_REGEX } from '@/constants/regexp.js';

function removeMentionFromLink<T extends PhrasingContent | RootContent>(nodes: T[]): Array<T | Text> {
    return compact(
        nodes.reduce<Array<T | Text>>((acc, node, index) => {
            const prevNode = acc[index - 1];
            if (
                node.type === 'link' &&
                !node.url.startsWith('http') &&
                prevNode?.type === 'text' &&
                (prevNode.value.endsWith('@') || /\s+@\S+$/.test(prevNode.value))
            ) {
                acc[index - 1] = null as unknown as T;
                return acc.concat({
                    type: 'text',
                    value: `${prevNode.value}${node.title}`,
                });
            }
            if ('children' in node && node.children?.length) {
                node.children = removeMentionFromLink(node.children as PhrasingContent[]);
            }

            return acc.concat(node);
        }, []),
    );
}

export function UrlPlugin() {
    return (ast: Root) => {
        const root: Root = linkifyRegex(URL_REGEX)()(ast);
        if (root.children.length) {
            root.children = removeMentionFromLink(root.children);
        }
        return root;
    };
}
