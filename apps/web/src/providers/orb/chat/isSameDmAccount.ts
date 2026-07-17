export function isSameDmAccount(account: string | null | undefined, targetAccount: string | null | undefined) {
    if (!account || !targetAccount) return false;
    return account.trim().toLowerCase() === targetAccount.trim().toLowerCase();
}
