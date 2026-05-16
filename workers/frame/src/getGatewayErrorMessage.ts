export function getGatewayErrorMessage(error: unknown, fallback?: string) {
    if (error instanceof Error) return error.message;
    return fallback || JSON.stringify(error);
}
