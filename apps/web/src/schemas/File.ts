import { ALLOWED_MEDIA_MIMES } from '@dimensiondev/constants/computed';
import { z, ZodError, ZodIssueCode } from 'zod';

import { isMediaFileType } from '@/helpers/isMediaFileType.js';

export const AnyFileSchema = z.custom<File>((value) => {
    if (!(value instanceof File)) {
        throw new ZodError([
            {
                message: `The file not found`,
                path: [],
                code: ZodIssueCode.invalid_type,
                expected: 'object',
                received: typeof value,
            },
        ]);
    }
    return value;
});

export const FileSchema = z.custom<File>((value) => {
    const file = AnyFileSchema.parse(value);
    if (!isMediaFileType(file.type)) {
        throw new ZodError([
            {
                message: `Invalid file type ${file.type}. Allowed types: ${ALLOWED_MEDIA_MIMES.join(', ')}`,
                path: [],
                code: ZodIssueCode.invalid_type,
                expected: 'string',
                received: 'string',
            },
        ]);
    }
    return value;
});
