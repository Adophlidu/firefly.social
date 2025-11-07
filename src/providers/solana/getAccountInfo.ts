import { web3 } from '@coral-xyz/anchor';
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';

enum AccountState {
    Uninitialized = 0,
    Initialized = 1,
    Frozen = 2,
}

async function getAccountInfo(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitment?: web3.Commitment,
    programId: web3.PublicKey = TOKEN_PROGRAM_ID,
) {
    const info = await connection.getAccountInfo(address, commitment);
    if (!info) throw new Error('TokenAccountNotFoundError');
    if (!info.owner.equals(programId)) throw new Error('TokenInvalidAccountOwnerError');
    if (info.data.length !== AccountLayout.span) throw new Error('TokenInvalidAccountSizeError');

    const rawAccount = AccountLayout.decode(Buffer.from(info.data));

    return {
        address,
        mint: rawAccount.mint,
        owner: rawAccount.owner,
        amount: rawAccount.amount,
        delegate: rawAccount.delegateOption ? rawAccount.delegate : null,
        delegatedAmount: rawAccount.delegatedAmount,
        isInitialized: rawAccount.state !== AccountState.Uninitialized,
        isFrozen: rawAccount.state === AccountState.Frozen,
        isNative: !!rawAccount.isNativeOption,
        rentExemptReserve: rawAccount.isNativeOption ? rawAccount.isNative : null,
        closeAuthority: rawAccount.closeAuthorityOption ? rawAccount.closeAuthority : null,
    };
}
