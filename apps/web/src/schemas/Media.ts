import { z } from 'zod';

export const InitMediaSchema = z.object({
    total_bytes: z.string(),
    media_type: z.string(),
    media_category: z.string().optional(),
    additional_owners: z.string().optional(),
});

export const AppendMediaSchema = z.object({
    media_id: z.string(),
    segment_index: z.string(),
});

export const FinishUploadSchema = z.object({
    media_id: z.string(),
});
