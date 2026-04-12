import type { Account } from '@lens-protocol/client';

export function isMutedLensAccount(account: Account) {
    return (account.operations?.isMutedByMe || account.operations?.isBlockedByMe) ?? false;
}
