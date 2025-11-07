import type { Link, Text } from 'mdast';

type Node = Link | Text;

export function splitTextChildren(regex: RegExp, text: string): Node[] {
    const matches = [...text.matchAll(regex)];
    if (!matches.length) {
        return [{ type: 'text', value: text }];
    }
    const newChildren: Node[] = [];
    let lastIndex = 0;
    for (const match of matches) {
        if (match.index > lastIndex) {
            newChildren.push({
                type: 'text',
                value: text.substring(lastIndex, match.index),
            });
        }
        newChildren.push({
            type: 'link',
            title: match[0],
            url: `#${match[1]}`,
            children: [{ type: 'text', value: match[0] }],
        });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        newChildren.push({
            type: 'text',
            value: text.substring(lastIndex),
        });
    }
    return newChildren;
}
