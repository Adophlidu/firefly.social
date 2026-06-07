import z from 'zod';

export const MediaTokenSchema = z.object({
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    sessionToken: z.string(),
    region: z.string(),
    bucket: z.string(),
    cdnHost: z.string(),
});

export type MediaToken = z.infer<typeof MediaTokenSchema>;
