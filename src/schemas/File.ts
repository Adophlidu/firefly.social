import { z, ZodError, ZodIssueCode } from 'zod';

import { ALLOWED_MEDIA_MIMES } from '@/constants/index.js';
import { isMediaFileType } from '@/helpers/isMediaFileType.js';

export const FileSchema = z.custom<File>((value) => {
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
    if (!isMediaFileType(value.type)) {
        throw new ZodError([
            {
                message: `Invalid file type. Allowed types: ${ALLOWED_MEDIA_MIMES.join(', ')}`,
                path: [],
                code: ZodIssueCode.invalid_type,
                expected: 'string',
                received: 'string',
            },
        ]);
    }
    return value;
});
