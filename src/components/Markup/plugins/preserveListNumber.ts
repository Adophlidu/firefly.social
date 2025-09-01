import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';

export const preserveListNumbers = () => (tree: Root) => {
    visit(tree, 'list', (node) => {
        if (node.ordered && node.start) {
            node.data = node.data || {};
            node.data.hProperties = node.data.hProperties || {};
            node.data.hProperties.start = node.start;
        }
    });
};
