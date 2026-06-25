import { isLessThan } from '@dimensiondev/web3/numbers';
import { useNavigate } from '@tanstack/react-router';

import { ModalType } from '@/configs/modalRoutes.js';
import { useTotalBalance } from '@/hooks/useTotalBalance.js';

// Below this balance the swap-based "Fund via Firefly Wallet" flow has nothing to
// swap from, so add-fund entries route straight to QR crypto deposit.
export const MIN_FIREFLY_WALLET_BALANCE_USD = 0.1;

/**
 * Gate used by both add-fund entries: true when the Firefly embedded wallet holds
 * less than MIN_FIREFLY_WALLET_BALANCE_USD (or balance is not yet loaded), so the
 * user goes to QR crypto deposit instead of the swap form.
 */
export function shouldRouteToCryptoDeposit(balance: string | undefined): boolean {
    return isLessThan(balance ?? '0', MIN_FIREFLY_WALLET_BALANCE_USD);
}

/**
 * Shared add-fund entry for the bet home "Add Funds" button and the no-account
 * AddFundGuide. Opens QR crypto deposit over bet home when the balance is below
 * MIN_FIREFLY_WALLET_BALANCE_USD, otherwise navigates to the swap-based deposit
 * page. The auto-route is silent: QR deposit telemetry fires only on the explicit
 * QR entry (QR icon / "Deposit via Crypto Address" button).
 */
export function useOpenBetDeposit() {
    const navigate = useNavigate();
    const { data: totalBalance } = useTotalBalance();

    return () => {
        if (shouldRouteToCryptoDeposit(totalBalance)) {
            navigate({ to: '/bet', search: { modal: ModalType.DepositViaCrypto } });
            return;
        }
        navigate({ to: '/bet/deposit' });
    };
}
