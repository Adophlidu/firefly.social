import { Source } from '@dimensiondev/enums';
import { resolveValue, safeUnreachable } from '@dimensiondev/utils';
import type { Link, Node as MdastNode, Root, Text } from 'mdast';
import flatMap from 'unist-util-flatmap';

import type { SocialSource } from '@/constants/enum.js';
import {
    BSKY_MENTION_REGEX,
    FARCASTER_MENTION_REGEX,
    LENS_MENTION_REGEX,
    TWITTER_MENTION_REGEX,
} from '@/constants/regexp.js';

type Node = Link | Text;

function splitTextChildren(regex: RegExp, text: string): Node[] {
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
            url: `@${match[1]}`,
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

export function MentionPlugin(source?: SocialSource) {
    const regex = resolveValue(() => {
        if (!source) return new RegExp(FARCASTER_MENTION_REGEX);

        switch (source) {
            case Source.Bsky:
                return BSKY_MENTION_REGEX;
            case Source.Lens:
                return LENS_MENTION_REGEX;
            case Source.Twitter:
                return TWITTER_MENTION_REGEX;
            case Source.Farcaster:
                return new RegExp(FARCASTER_MENTION_REGEX);
            default:
                safeUnreachable(source);
                return new RegExp(FARCASTER_MENTION_REGEX);
        }
    });
    return () => {
        return (ast: Root) => {
            flatMap(ast, ((node: MdastNode, _index: number, parent: MdastNode | null) => {
                if (node.type !== 'text') return [node];
                // Skip text inside link nodes to prevent nested <a> tags
                if (parent?.type === 'link') return [node];
                return splitTextChildren(regex, (node as Text).value);
            }) as any);
            return ast;
        };
    };
}
