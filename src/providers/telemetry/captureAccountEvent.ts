import { createLookupTableResolver, safeUnreachable } from '@firefly/utils';

import { type LoginSource, type ProfileSource, Source } from '@/constants/enum.js';
import { NotAllowedError, UnreachableError } from '@/constants/error.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import type { Account } from '@/providers/types/Account.js';
import type { Session } from '@/providers/types/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { type AccountPairs, EventId, FarcasterLoginType } from '@/providers/types/Telemetry.js';
import { useThirdPartyProfileStore } from '@/store/useProfileStore/useThirdPartyProfileStore.js';

const resolveLoginEventId = createLookupTableResolver<LoginSource, EventId>(
    {
        [Source.Farcaster]: EventId.FARCASTER_LOG_IN_SUCCESS,
        [Source.Lens]: EventId.LENS_ACCOUNT_LOG_IN_SUCCESS,
        [Source.Twitter]: EventId.X_ACCOUNT_LOG_IN_SUCCESS,
        [Source.Bsky]: EventId.BSKY_ACCOUNT_LOG_IN_SUCCESS,
        [Source.Google]: EventId.GOOGLE_ACCOUNT_LOG_IN_SUCCESS,
        [Source.Apple]: EventId.APPLE_ACCOUNT_LOG_IN_SUCCESS,
        [Source.Telegram]: EventId.TELEGRAM_ACCOUNT_LOG_IN_SUCCESS,
        [Source.Email]: EventId.EMAIL_ACCOUNT_LOG_IN_SUCCESS,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

const resolveLogoutEventId = createLookupTableResolver<LoginSource, EventId>(
    {
        [Source.Farcaster]: EventId.FARCASTER_LOG_OUT_SUCCESS,
        [Source.Lens]: EventId.LENS_ACCOUNT_LOG_OUT_SUCCESS,
        [Source.Twitter]: EventId.X_ACCOUNT_LOG_OUT_SUCCESS,
        [Source.Bsky]: EventId.BSKY_ACCOUNT_LOG_OUT_SUCCESS,
        [Source.Apple]: EventId.APPLE_ACCOUNT_LOG_OUT_SUCCESS,
        [Source.Google]: EventId.GOOGLE_ACCOUNT_LOG_OUT_SUCCESS,
        [Source.Telegram]: EventId.TELEGRAM_ACCOUNT_LOG_OUT_SUCCESS,
        [Source.Email]: EventId.EMAIL_ACCOUNT_LOG_OUT_SUCCESS,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

const resolveDisconnectEventId = createLookupTableResolver<LoginSource, EventId>(
    {
        [Source.Farcaster]: EventId.FARCASTER_ACCOUNT_DISCONNECT_SUCCESS,
        [Source.Lens]: EventId.LENS_ACCOUNT_DISCONNECT_SUCCESS,
        [Source.Twitter]: EventId.X_ACCOUNT_DISCONNECT_SUCCESS,
        [Source.Bsky]: EventId.BSKY_ACCOUNT_DISCONNECT_SUCCESS,
        [Source.Apple]: EventId.APPLE_ACCOUNT_DISCONNECT_SUCCESS,
        [Source.Google]: EventId.GOOGLE_ACCOUNT_DISCONNECT_SUCCESS,
        [Source.Telegram]: EventId.TELEGRAM_ACCOUNT_DISCONNECT_SUCCESS,
        [Source.Email]: EventId.EMAIL_ACCOUNT_DISCONNECT_SUCCESS,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function getAccountPairs(source: ProfileSource) {
    return getProfileState(source).accounts.map((x) => [x.profile.profileId, x.profile.handle]) as AccountPairs;
}

function getLoginType(session?: Session | null): FarcasterLoginType | void {
    if (!session || session?.type !== SessionType.Farcaster) return;
    if (FarcasterSession.isSponsorship(session)) return FarcasterLoginType.NewConnect;
    if (FarcasterSession.isLoginByWallet(session)) return FarcasterLoginType.Wallet;
    if (FarcasterSession.isRelayService(session)) return FarcasterLoginType.Reconnect;
    if (FarcasterSession.isGrantByPermission(session)) return FarcasterLoginType.NewConnect;
}

export function getAccountEventParameters(
    account: Pick<Account, 'profile' | 'origin'> & Partial<Pick<Account, 'session'>>,
) {
    const source = account.profile.profileSource;
    const accounts = getAccountPairs(source);
    const loginType = getLoginType(account.session);

    switch (source) {
        case Source.Farcaster:
            return {
                is_token_sync: account.origin === 'sync',
                farcaster_id: account.profile.profileId,
                farcaster_handle: account.profile.handle,
                farcaster_accounts: accounts,
                login_type: loginType,
            };
        case Source.Lens:
            return {
                is_token_sync: account.origin === 'sync',
                lens_id: account.profile.profileId,
                lens_handle: account.profile.handle,
                lens_accounts: accounts,
            };
        case Source.Twitter:
            return {
                is_token_sync: account.origin === 'sync',
                x_id: account.profile.profileId,
                x_handle: account.profile.handle,
                x_accounts: accounts,
            };
        case Source.Bsky:
            return {
                is_token_sync: account.origin === 'sync',
                bsky_id: account.profile.profileId,
                bsky_handle: account.profile.handle,
                bsky_accounts: accounts,
            };
        case Source.Google:
            return {
                is_token_sync: account.origin === 'sync',
                google_id: account.profile.profileId,
                google_handle: account.profile.handle,
                google_accounts: useThirdPartyProfileStore
                    .getState()
                    .accounts.filter((x) => x.profile.profileSource === Source.Google)
                    .map((x) => [x.profile.profileId, x.profile.handle]),
            };
        case Source.Apple:
            return {
                is_token_sync: account.origin === 'sync',
                apple_id: account.profile.profileId,
                apple_handle: account.profile.handle,
                apple_accounts: useThirdPartyProfileStore
                    .getState()
                    .accounts.filter((x) => x.profile.profileSource === Source.Apple)
                    .map((x) => [x.profile.profileId, x.profile.handle]),
            };
        case Source.Telegram:
            return {
                is_token_sync: account.origin === 'sync',
                telegram_id: account.profile.profileId,
                telegram_handle: account.profile.handle,
                telegram_accounts: useThirdPartyProfileStore
                    .getState()
                    .accounts.filter((x) => x.profile.profileSource === Source.Telegram)
                    .map((x) => [x.profile.profileId, x.profile.handle]),
            };
        case Source.Email:
            return {
                is_token_sync: account.origin === 'sync',
                email_id: account.profile.profileId,
            };
        case Source.Firefly:
            throw new NotAllowedError();
        default:
            safeUnreachable(source);
            throw new UnreachableError('source', source);
    }
}

export function captureAccountCreateSuccessEvent(account: Account) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.ACCOUNT_CREATE_SUCCESS, {
            by_lens: account.profile.source === Source.Lens,
            by_farcaster: account.profile.source === Source.Farcaster,
            by_x: account.profile.source === Source.Twitter,
            ...getAccountEventParameters(account),
        });
    });
}

export async function captureAccountLoginEvent(account: Account) {
    return runInSafeAsync(async () => {
        const source = account.profile.source;
        return TelemetryProvider.captureEvent(resolveLoginEventId(source), getAccountEventParameters(account));
    });
}

export function captureAccountLogoutEvent(account: Account) {
    return runInSafeAsync(() => {
        const source = account.profile.source;
        return TelemetryProvider.captureEvent(resolveLogoutEventId(source), getAccountEventParameters(account));
    });
}

export function captureAccountDisconnectEvent(account: Pick<Account, 'profile' | 'origin'>) {
    return runInSafeAsync(() => {
        const source = account.profile.source;
        return TelemetryProvider.captureEvent(resolveDisconnectEventId(source), getAccountEventParameters(account));
    });
}

export function captureAccountLogoutAllEvent(accounts: Account[]) {
    return runInSafeAsync(async () => {
        await Promise.all(accounts.map((account) => captureAccountLogoutEvent(account)));
        await TelemetryProvider.captureEvent(EventId.ACCOUNT_LOG_OUT_ALL_SUCCESS, {});
    });
}

export function captureAccountConflictEvent(conflictAccountId: string, confirmed: boolean) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.ACCOUNT_CONFLICT, {
            conflict_firefly_account_id: conflictAccountId,
            continue_login: confirmed,
        });
    });
}

export function captureAccountDeleteEvent(accountId: string) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.ACCOUNT_DELETE_SUCCESS, {
            firefly_account_id: accountId,
            farcaster_accounts: getAccountPairs(Source.Farcaster),
            lens_accounts: getAccountPairs(Source.Lens),
            x_accounts: getAccountPairs(Source.Twitter),
            bsky_accounts: getAccountPairs(Source.Bsky),
        });
    });
}
