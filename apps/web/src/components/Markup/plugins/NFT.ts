import type { Root } from 'mdast';
import flatMap from 'unist-util-flatmap';

export function NFTPlugin() {
    return () => (ast: Root) => {
        flatMap(ast, (node) => {
            if (node.type !== 'text') return [node];
            if (node.value.startsWith('nft://')) {
                return [
                    {
                        type: 'link',
                        title: node.value,
                        url: node.value,
                        children: [{ type: 'text', value: node.value }],
                    },
                ];
            }
            return [node];
        });

        return ast;
    };
}
