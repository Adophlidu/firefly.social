import { z } from 'zod';

import { MetadataAttributeSchema } from '@/providers/lens/metadata/Base.js';
import {
    ContentWarningSchema,
    LocaleSchema,
    MetadataIdSchema,
    type PostMainFocus,
    TagSchema,
} from '@/providers/lens/metadata/post/Base.js';

export function metadataDetailsWith<
    Augmentation extends {
        mainContentFocus:
            | z.ZodLiteral<PostMainFocus>
            | z.ZodUnion<[z.ZodLiteral<PostMainFocus>, ...Array<z.ZodLiteral<PostMainFocus>>]>;
    },
>(augmentation: Augmentation) {
    return z
        .object({
            id: MetadataIdSchema,

            attributes: MetadataAttributeSchema.array().min(1).max(20).optional(),

            locale: LocaleSchema,

            tags: z
                .set(TagSchema)
                .max(20)
                .catch((ctx) => ctx.input as Set<string>)
                .superRefine((input, ctx) => {
                    // but needs to be corrected in code
                    const result = z.array(TagSchema).max(20).safeParse(input);

                    if (result.success) {
                        const uniqueTags = [...new Set(result.data)];
                        if (result.data.length > uniqueTags.length) {
                            ctx.addIssue({
                                code: z.ZodIssueCode.custom,
                                fatal: true,
                                message: `Duplicate tags are not allowed: ${result.data.join(', ')}`,
                            });
                        }
                        return z.NEVER;
                    }

                    for (const issue of result.error.issues) {
                        ctx.addIssue(issue);
                    }
                })
                .transform((value) => [...value]) // type coercion
                .optional(),

            contentWarning: ContentWarningSchema.optional(),
        })
        .extend(augmentation);
}
