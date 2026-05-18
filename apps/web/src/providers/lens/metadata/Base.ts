import { MetadataAttributeType } from '@dimensiondev/enums';
import { z } from 'zod';

function nonEmptySchema(schema: z.ZodString): z.ZodType<string, z.ZodTypeDef, unknown> {
    return z.preprocess((val, ctx) => {
        const result = z.string().safeParse(val);

        if (!result.success) {
            for (const issue of result.error.issues) {
                // why fatal = true? see: https://github.com/colinhacks/zod/pull/2912#issuecomment-2010989328
                ctx.addIssue({ ...issue, fatal: true });
            }

            return z.NEVER;
        }

        return (
            result.data
                // eslint-disable-next-line no-control-regex
                .replace(/^[\u0000\u0007\u000e\u000f\u200b-\u200d\ufeff]*/, '')
                // eslint-disable-next-line no-control-regex
                .replace(/[\u0000\u0007\u000e\u000f\u200b-\u200d\ufeff]*$/, '')
                .trim()
        );
    }, schema.min(1));
}

export const NonEmptyStringSchema = nonEmptySchema(z.string());

const BooleanAttributeSchema = z.object({
    type: z.literal(MetadataAttributeType.BOOLEAN),
    key: NonEmptyStringSchema,
    value: z.enum(['true', 'false']),
});
const DateAttributeSchema = z.object({
    type: z.literal(MetadataAttributeType.DATE),
    key: NonEmptyStringSchema,
    value: z.string().datetime(),
});
const NumberAttributeSchema = z.object({
    type: z.literal(MetadataAttributeType.NUMBER),
    key: NonEmptyStringSchema,
    value: NonEmptyStringSchema,
});
const StringAttributeSchema = z.object({
    type: z.literal(MetadataAttributeType.STRING),
    key: NonEmptyStringSchema,
    value: NonEmptyStringSchema,
});
const JSONAttributeSchema = z.object({
    type: z.literal(MetadataAttributeType.JSON),
    key: NonEmptyStringSchema,
    value: NonEmptyStringSchema,
});

export const MetadataAttributeSchema = z.discriminatedUnion('type', [
    BooleanAttributeSchema,
    DateAttributeSchema,
    NumberAttributeSchema,
    StringAttributeSchema,
    JSONAttributeSchema,
]);
export const URISchema = z
    .string()
    .min(6) // [ar://.]
    .url({ message: 'Should be a valid URI' });
export const SignatureSchema: z.ZodType<string, z.ZodTypeDef, unknown> = z.string().min(1);

export type MetadataAttribute =
    | {
          value: 'true' | 'false';
          type: MetadataAttributeType.BOOLEAN;
          key: string;
      }
    | {
          value: string;
          type:
              | MetadataAttributeType.DATE
              | MetadataAttributeType.NUMBER
              | MetadataAttributeType.STRING
              | MetadataAttributeType.JSON;
          key: string;
      };
