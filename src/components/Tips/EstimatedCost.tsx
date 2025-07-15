import { Trans } from '@lingui/react/macro';
import type { BigNumber } from 'bignumber.js';

import { NetworkType } from '@/constants/enum.js';
import { formatLamportsToSol } from '@/helpers/formatLamportsToSol.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getNativeToken } from '@/helpers/getNativeToken.js';
import { isZero, leftShift } from '@/helpers/number.js';
import { TipsContext } from '@/hooks/useTipsContext.js';

interface EstimatedCostProps {
    gas: BigNumber;
}

export function EstimatedCost({ gas }: EstimatedCostProps) {
    const { token, recipient } = TipsContext.useContainer();
    const nativeToken = token && recipient ? getNativeToken(recipient.networkType, token.chainId) : null;

    return (
        <p className="mt-4 flex h-5 items-center justify-between text-sm">
            <span className="text-second">
                <Trans>Estimated cost</Trans>
            </span>
            <span className="font-medium text-main">
                {!token || !nativeToken || isZero(gas)
                    ? '-'
                    : recipient?.networkType === NetworkType.Ethereum
                      ? `${formatPrice(leftShift(gas, nativeToken.decimals).toString())} ${nativeToken.symbol}`
                      : `${formatLamportsToSol(gas.toString())} SOL`}
            </span>
        </p>
    );
}
