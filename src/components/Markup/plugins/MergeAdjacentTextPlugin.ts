import { type PhrasingContent, type Root, type RootContent, type Text } from 'mdast';

function mergeAdjacentText<T extends PhrasingContent | RootContent>(nodes: T[]): Array<T | Text> {
    const result: Array<T | Text> = [];
    let buffer: string | null = null;

    for (const node of nodes) {
        if (node.type === 'text') {
            if (buffer === null) {
                buffer = node.value;
            } else {
                buffer += node.value;
            }
        } else {
            if (buffer !== null) {
                result.push({
                    type: 'text',
                    value: buffer,
                } as Text);
                buffer = null;
            }
            if ('children' in node && node.children?.length) {
                node.children = mergeAdjacentText(node.children as PhrasingContent[]);
            }
            result.push(node);
        }
    }

    if (buffer !== null) {
        result.push({
            type: 'text',
            value: buffer,
        } as Text);
    }
    return result;
}

export function MergeAdjacentTextPlugin() {
    return (ast: Root) => {
        if (ast.children.length) {
            ast.children = mergeAdjacentText(ast.children);
        }
        return ast;
    };
}
