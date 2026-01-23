import { type List, type ListItem, type Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { type VFile } from 'vfile';

export const preserveListNumbers = () => (tree: Root, file: VFile) => {
    const source = String(file);

    visit(tree, 'list', (node: List) => {
        if (node.ordered && node.start) {
            node.data = node.data || {};
            node.data.hProperties = node.data.hProperties || {};
            node.data.hProperties.start = node.start;
        }
    });

    visit(tree, 'listItem', (node: ListItem, _index, parent) => {
        const parentList = parent as List | undefined;
        if (parentList?.ordered === false && node.position && source) {
            const startOffset = node.position.start.offset;
            if (startOffset !== undefined) {
                const lineStart = source.lastIndexOf('\n', startOffset - 1) + 1;
                const lineContent = source.slice(lineStart, startOffset + 5);
                const match = lineContent.match(/^\s*([-*+])\s/);
                if (match) {
                    node.data = node.data || {};
                    node.data.hProperties = node.data.hProperties || {};
                    node.data.hProperties['data-marker'] = match[1];
                }
            }
        }
    });
};
