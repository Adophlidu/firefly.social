import { safeUnreachable } from '@dimensiondev/utils';
import { type Root } from 'mdast';
import flatMap from 'unist-util-flatmap';

import { splitTextChildren } from '@/components/Markup/plugins/splitTextChildren.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { resolveValue } from '@/helpers/resolveValue.js';

const DEFAULT_HASH_TAG_REGEX = /#(?![0-9]+$)(?=.*[a-zA-Z])[\p{L}\p{N}_-]+/gu;
const TWITTER_HASH_TAG_REGEXP = /(^|\s)#(?![0-9]+$)(?=.*[a-zA-Z])[\p{L}\p{N}_]+/gu;

export function HashTagLink(source?: SocialSource) {
    const regex = resolveValue(() => {
        if (!source) return new RegExp(DEFAULT_HASH_TAG_REGEX);

        switch (source) {
            case Source.Bsky:
            case Source.Lens:
            case Source.Farcaster:
                return new RegExp(DEFAULT_HASH_TAG_REGEX);
            case Source.Twitter:
                return new RegExp(TWITTER_HASH_TAG_REGEXP);
            default:
                safeUnreachable(source);
                return new RegExp(DEFAULT_HASH_TAG_REGEX);
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
