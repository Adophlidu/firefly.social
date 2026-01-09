import { type PhrasingContent, type Root, type RootContent, type Text } from 'mdast';

function removeItalic<T extends PhrasingContent | RootContent>(nodes: T[]): Array<T | Text> {
    return nodes.reduce<Array<T | Text>>((acc, node) => {
        if (node.type === 'emphasis') {
            const textValue = (node.children as Text[]).map((child) => (child as Text).value ?? '').join('');
            acc.push({
                type: 'text',
                value: `_${textValue}_`,
            } as Text);
        } else {
            if ('children' in node && node.children?.length) {
                node.children = removeItalic(node.children as PhrasingContent[]);
            }
            acc.push(node);
        }
        return acc;
    }, []);
}

export function DisableItalicPlugin() {
    return (ast: Root) => {
        if (ast.children.length) {
            ast.children = removeItalic(ast.children);
        }
        return ast;
    };
}
