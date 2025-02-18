interface Response<T> {
    success: boolean;
    data: T;
}

export function resolveBskyResponseData<T>(response: Response<T>, message?: string) {
    const errorMessage = typeof message === 'string' ? message : 'Failed to resolve bsky response data.';
    if (!response.success) throw new Error(errorMessage);

    return response.data;
}
