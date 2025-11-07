import type { Root } from 'mdast';
import flatMap from 'unist-util-flatmap';

import { splitTextChildren } from '@/components/Markup/plugins/splitTextChildren.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { resolveValue } from '@/helpers/resolveValue.js';

export function HashTagLink(source?: SocialSource) {
    const regex = resolveValue(() => {
        switch (source) {
            case Source.Bsky:
            case Source.Lens:
            case Source.Farcaster:
                return /#(?![0-9]+$)(?=.*[a-zA-Z])[\p{L}\p{N}_-]+/gu;
            case Source.Twitter:
                return /(^|\s)#(?![0-9]+$)(?=.*[a-zA-Z])[\p{L}\p{N}_]+/gu;
            default:
                return /#(?![0-9]+$)(?=.*[a-zA-Z])[\p{L}\p{N}_-]+/gu;
        }
    });
    return () => {
        return (ast: Root) => {
            flatMap(ast, (node) => {
                if (node.type !== 'text') return [node];
                return splitTextChildren(regex, node.value);
            });
            return ast;
        };
    };
}
