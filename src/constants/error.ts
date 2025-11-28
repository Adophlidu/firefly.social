import { parseJson } from '@dimensiondev/utils';

import type { ProfileSource } from '@/constants/enum.js';
import { parseHtml } from '@/helpers/parseHtml.js';

export class AbortError extends Error {
    override name = 'AbortError';

    constructor(message = 'Aborted') {
        super(message);
    }

    static is(error: unknown) {
        return error instanceof AbortError || (error instanceof DOMException && error.name === 'AbortError');
    }
}

export class DecryptionError extends Error {
    override name = 'DecryptionFailed';

    constructor(message?: string) {
        super(message ?? 'Decryption failed');
    }
}

export class MalformedError extends Error {
    override name = 'MalformedError';

    constructor(message?: string) {
        super(message ?? 'Malformed request');
    }
}

export class UnauthorizedError extends Error {
    override name = 'UnauthorizedError';

    constructor(message?: string) {
        super(message ?? 'Unauthorized');
    }
}

export class ForbiddenError extends Error {
    override name = 'ForbiddenError';

    constructor(message?: string) {
        super(message ?? 'Forbidden');
    }
}

export class NetworkError extends Error {
    override name = 'NetworkError';

    constructor(message?: string) {
        super(message ?? 'Network error');
    }
}

async function getResponseText(response: Response): Promise<string> {
    try {
        const text = await response.clone().text();
        if (response.headers.get('content-type')?.includes('text/html')) {
            const dom = parseHtml(text);
            return dom.querySelector('title')?.textContent || 'Internal service error';
        }
        return text;
    } catch {
        return '';
    }
}

export class FetchError extends Error {
    override name = 'FetchError';

    constructor(
        message: string,
        public url: string,
        public status: number,
        public statusText: string,
        public text: string,
    ) {
        super(message);
    }

    toThrow(): never {
        // for sentry will truncate the message if it's too long
        console.error(
            `[fetch error]: ${this.url} ${this.status} ${this.statusText} ${[this.message, this.text].join('\n')}`,
        );
        throw this;
    }

    static async from(input: RequestInfo | URL | string, response: Response, message?: string) {
        const method = typeof input === 'string' ? 'GET' : input instanceof URL ? 'GET' : input.method.toUpperCase();
        const text = await getResponseText(response);

        return new FetchError(
            message ??
                [
                    `[fetch] failed to fetch: ${method} ${response.status} ${response.statusText} ${response.url}`,
                    text,
                ].join('\n'),
            response.url,
            response.status,
            response.statusText,
            text,
        );
    }

    get errorMessage() {
        const parsed = parseJson<{ error?: string[] | string }>(this.text);
        if (parsed?.error) {
            return Array.isArray(parsed.error) ? parsed.error.join(', ') : parsed.error;
        }

        return;
    }
}

export class FarcasterPatchSignerError extends Error {
    override name = 'FarcasterPatchSignerError';

    constructor(public fid: number) {
        super(`Failed to patch signer key to Farcaster session: ${fid}`);
    }
}

export class FarcasterInvalidSignerKey extends Error {
    override name = 'FarcasterInvalidSignerKey';

    constructor(message?: string) {
        super(message ?? 'Invalid Farcaster signer key.');
    }
}

export class FireflyAccountAbsentError extends Error {
    override name = 'FireflyAccountAbsentError';
    constructor(public source: ProfileSource) {
        super(`This ${source} account does not exists.`);
    }
}

export class FireflyAlreadyBoundError extends Error {
    override name = 'FireflyAlreadyBoundError';

    constructor(public source: ProfileSource) {
        super(`This ${source} account has already bound to another Firefly account.`);
    }
}

export class FireflyBindTimeoutError extends Error {
    override name = 'FireflyBindTimeoutError';
    constructor(public source: ProfileSource) {
        super(`Bind ${source} account to Firefly timeout.`);
    }
}

export class ContentTypeError extends Error {
    override name = 'ContentTypeError';

    constructor(message?: string) {
        super(message ?? 'Content-Type is not multipart/form-data');
    }
}

export class AuthenticationError extends Error {
    override name = 'AuthenticationError';

    constructor(message?: string) {
        super(message ?? 'Failed to authenticate');
    }
}

export class UserRejectionError extends Error {
    override name = 'UserRejectionError';

    constructor(message?: string) {
        super(message ?? 'User rejected.');
    }
}

export class TimeoutError extends Error {
    override name = 'TimeoutError';

    constructor(message?: string) {
        super(message ?? 'Timeout.');
    }
}

export class UnreachableError extends Error {
    override name = 'UnreachableError';

    constructor(label: string, value: unknown) {
        super(`Unreachable ${label} = ${value}.`);
    }
}

export class NotImplementedError extends Error {
    override name = 'NotImplementedError';

    constructor(message?: string) {
        super(message ?? 'Not implemented.');
    }
}

export class NotAllowedError extends Error {
    override name = 'NotAllowedError';

    constructor(message?: string) {
        super(message ?? 'Not allowed.');
    }
}

export class InvalidResultError extends Error {
    override name = 'InvalidResultError';

    constructor() {
        super('Invalid result.');
    }
}

export class InvalidOrbPermissionError extends Error {
    override name = 'InvalidOrbPermissionError';

    constructor() {
        super('Invalid Orb permission.');
    }
}

export class NotFoundError extends Error {
    override name = 'NotFoundError';

    constructor(message?: string) {
        super(message ?? 'Not Found.');
    }
}

export class RPC_Error extends Error {
    override name = 'RPC_Error';

    constructor(message?: string) {
        super(message ?? 'RPC Error.');
    }
}

export class SwitchChainError extends Error {
    override name = 'SwitchChainError';

    constructor(chainName?: string) {
        super(
            chainName
                ? `Please switch to the ${chainName} network in your wallet.`
                : `Please switch to the correct network in your wallet.`,
        );
    }
}

export class CreateScheduleError extends Error {
    override name = 'CreateScheduleError';

    constructor(
        public override message: string,
        public description?: string,
    ) {
        super(message);
    }
}

export class OTPExceededMaximumLimit extends Error {
    override name = 'OTPExceededMaximumLimit';

    constructor(message?: string) {
        super(message ?? 'OTP exceeded maximum limit.');
    }
}

export class LoginEmailError extends Error {
    override name = 'LoginEmailError';

    constructor(message?: string) {
        super(message ?? 'The code you’ve entered is incorrect, please try again.');
    }
}

export class RecognizableError extends Error {
    override name = 'RecognizableError';

    constructor(
        message?: string,
        public isRecognized = false,
    ) {
        super(message ?? 'Recognizable error.');
    }
}

export class BskySessionExpiredError extends Error {
    override name = 'BskySessionExpiredError';

    constructor(message?: string) {
        super(message ?? 'Bsky session expired.');
    }
}

export class InvalidAddressError extends Error {
    override name = 'InvalidAddressError';

    constructor(address: string, message?: string) {
        super(message ?? `Invalid EVM address: ${address}.`);
    }
}

export class TokenExpiredError extends Error {
    override name = 'TokenExpiredError';

    constructor(message?: string) {
        super(message ?? 'Token has been expired.');
    }
}

export class AccountSuspendedError extends Error {
    override name = 'AccountSuspendedError';

    constructor(handle: string, source: ProfileSource, message?: string) {
        super(message ?? `Account suspended with handle=${handle}, source=${source}.`);
    }
}

export class WalletAddressMismatchError extends Error {
    override name = 'WalletAddressMismatchError';

    constructor(message?: string) {
        super(message ?? 'Wallet address mismatch.');
    }
}

export class WalletNotConnectedError extends Error {
    override name = 'WalletNotConnectedError';
}

export class ChainConfigMismatchError extends Error {
    override name = 'ChainConfigMismatchError';

    constructor(message?: string) {
        super(message ?? 'Chain config mismatch.');
    }
}

/**
 * Error thrown when a Bluesky XRPC endpoint is not supported (404).
 * This is expected when using custom PDS instances that don't support all endpoints.
 * Should be handled gracefully without logging to error tracking.
 */
export class XRPCNotSupportedError extends Error {
    override name = 'XRPCNotSupportedError';

    constructor(message?: string) {
        super(message ?? 'XRPC not supported.');
    }

    static is(error: unknown) {
        if (!error || typeof error !== 'object') return false;

        const err = error as Record<string, unknown>;

        // Check if it's an XRPCNotSupported error
        const isXRPCNotSupported =
            err.error === 'XRPCNotSupported' ||
            err.message === 'XRPCNotSupported' ||
            (typeof err.message === 'string' && err.message.includes('XRPCNotSupported'));

        // Check if status is 404
        const is404 = err.status === 404;

        return isXRPCNotSupported && is404;
    }
}
