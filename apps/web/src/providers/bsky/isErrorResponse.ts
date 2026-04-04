import z from 'zod';

const errorResponseBody = z.object({
    error: z.string().optional(),
    message: z.string().optional(),
});

function extractType({ headers }: Response) {
    return headers.get('Content-Type')?.split(';')[0]?.trim();
}
function extractLength({ headers }: Response) {
    return headers.get('Content-Length') ? Number(headers.get('Content-Length')) : NaN;
}
async function peekJson(response: Response, maxSize = Infinity): Promise<unknown> {
    if (extractType(response) !== 'application/json') throw new Error('Not valid json.');
    if (extractLength(response) > maxSize) throw new Error('Response too large.');

    return response.clone().json();
}
function isErrorObject(v: unknown): v is z.infer<typeof errorResponseBody> {
    return errorResponseBody.safeParse(v).success;
}

export async function isErrorResponse(response: Response, status: number[], errorNames: string[]): Promise<boolean> {
    if (!status.includes(response.status)) return false;

    try {
        const json = await peekJson(response, 10 * 1024);
        return isErrorObject(json) && !!json.error && errorNames.includes(json.error);
    } catch (err) {
        return false;
    }
}
