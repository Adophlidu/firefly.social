import type { ProfileSource, SocialSource } from '@dimensiondev/enums';
import { parseJson } from '@dimensiondev/utils';

import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { logger } from '@/libs/Logger.js';

export class DecryptionError extends Error {
    override name = 'DecryptionFailed';

    constructor(message?: string) {
        super(message ?? 'Decryption failed');
    }
}

export class MalformedRequestError extends Error {
    override name = 'MalformedRequestError';

    constructor(message?: string) {
        super(message ?? 'Malformed request');
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
        // exception tracker may truncate the message if it's too long
        logger.error(
            `[fetch error]: ${this.url} ${this.status} ${this.statusText} ${[this.message, this.text].join('\n')}`,
        );
        throw this;
    }

    static from(input: RequestInfo | URL | string, response: Response, text: string, message?: string) {
        const method = typeof input === 'string' ? 'GET' : input instanceof URL ? 'GET' : input.method.toUpperCase();

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
        const parsed = parseJson<{ error?: string[] | string | { message?: string } }>(this.text);
        if (parsed?.error) {
            if (Array.isArray(parsed.error)) return parsed.error.join(', ');
            if (typeof parsed.error === 'string') return parsed.error;
            if (typeof parsed.error === 'object' && typeof parsed.error.message === 'string')
                return parsed.error.message;
            return 'Unknown error';
        }
        return;
    }
}

/**
 * Thrown when a Firefly API request fails auth unrecoverably — i.e. a 401 that
 * survived a token refresh (the refresh token itself is expired/revoked).
 * Surfaced to the global error boundary to render the signed-out screen.
 */
export class FireflyUnauthorizedError extends Error {
    override name = 'FireflyUnauthorizedError';

    constructor(message?: string) {
        super(message ?? 'Firefly session is unauthorized.');
    }

    static is(error: unknown): error is FireflyUnauthorizedError {
        return (
            error instanceof FireflyUnauthorizedError ||
            (error instanceof Error && error.name === 'FireflyUnauthorizedError')
        );
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

export class FireflyFidNotRegisteredError extends Error {
    override name = 'FireflyFidNotRegisteredError';

    constructor(message?: string) {
        super(message ?? 'Your account has not registered this fid on Firefly');
    }
}

export class InvalidOrbPermissionError extends Error {
    override name = 'InvalidOrbPermissionError';

    constructor() {
        super('Invalid Orb permission.');
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

export class ChainConfigMismatchError extends Error {
    override name = 'ChainConfigMismatchError';

    constructor(message?: string) {
        super(message ?? 'Chain config mismatch.');
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
        super(message ?? 'The code you have entered is incorrect, please try again.');
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

export class NftScanError extends Error {
    override name = 'NftScanError';

    constructor(message?: string) {
        super(message ?? 'NftScan error.');
    }
}

export class SessionExpiredError extends Error {
    override name = 'SessionExpiredError';

    constructor(
        public source: SocialSource,
        message?: string,
    ) {
        super(message ?? `${resolveSourceName(source)} session has been expired.`);
    }
}

export class NitterError extends Error {
    override name = 'NitterError';

    constructor(url: string, message?: string) {
        super(`[NitterError] ${url} ${message || 'Unknown nitter error.'}`);
    }
}

export class TweetUnavailableError extends Error {
    static message = "You're unable to view this Post because this account owner limits who can view their Posts.";
    override name = 'TweetUnavailableError';
}
