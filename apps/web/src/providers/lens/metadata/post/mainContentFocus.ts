import { z } from 'zod';

import { type PostMainFocus } from '@/providers/lens/metadata/post/Base.js';

export function mainContentFocus<T extends PostMainFocus>(focus: T): z.ZodLiteral<T>;
export function mainContentFocus<T extends PostMainFocus, O extends PostMainFocus>(
    ...focuses: [T, O]
): z.ZodUnion<[z.ZodLiteral<T>, z.ZodLiteral<O>]>;
export function mainContentFocus(...focuses: [PostMainFocus, ...PostMainFocus[]]) {
    const description = 'The main focus of the post.';
    if (focuses.length > 1) {
        const literals = focuses.map((value) => z.literal(value)) as [
            z.ZodLiteral<PostMainFocus>,
            z.ZodLiteral<PostMainFocus>,
            ...Array<z.ZodLiteral<PostMainFocus>>,
        ];
        return z.union(literals, { description });
    }
    return z.literal(focuses[0], { description });
}
