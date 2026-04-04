import { parseJson } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';

import { type FetchError } from '@/constants/error.js';

export function getErrorMessageFromFetchError(error: FetchError): string {
    const parsedResponse = parseJson<{
        success: boolean;
        error: {
            code: number;
            message: string;
        };
    }>(error.text);

    if (typeof parsedResponse?.error?.message === 'string') {
        return parsedResponse.error.message;
    } else if (typeof parsedResponse?.error === 'string') {
        return parsedResponse.error;
    } else if (typeof parsedResponse === 'string') {
        return parsedResponse;
    }

    switch (error.status) {
        case 400:
            return t`Bad Request. Please check your request.`;
        case 401:
            return t`Unauthorized. Please check your login.`;
        case 403:
            return t`Forbidden. Please check your permissions.`;
        case 404:
            return t`Not Found. Please check your URL. [${error.url}]`;
        case 500:
            return t`Internal Server Error. Please try again later.`;
        default:
            return t`Failed to fetch: ${error.status}. Please try again later.`;
    }
}
