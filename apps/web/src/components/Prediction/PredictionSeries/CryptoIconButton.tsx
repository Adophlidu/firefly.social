import BnbIcon from '@dimensiondev/assets/tokens/bnb.svg';
import BtcIcon from '@dimensiondev/assets/tokens/btc.svg';
import DogeIcon from '@dimensiondev/assets/tokens/doge.svg';
import EthIcon from '@dimensiondev/assets/tokens/eth.svg';
import HypeIcon from '@dimensiondev/assets/tokens/hype.svg';
import SolIcon from '@dimensiondev/assets/tokens/sol.svg';
import XrpIcon from '@dimensiondev/assets/tokens/xrp.svg';
import { classNames, unreachable } from '@dimensiondev/utils';
import type { HTMLProps } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PredictionCrypto } from '@/constants/bets.js';
import { resolveCryptoColor } from '@/providers/prediction/resolveCryptoColor.js';

interface CryptoIconButtonProps {
    crypto: PredictionCrypto;
    selected?: boolean;
    onClick?: () => void;
}
interface CryptoIconProps extends HTMLProps<SVGElement> {
    crypto: PredictionCrypto;
}

export function CryptoIcon({ crypto, ...rest }: CryptoIconProps) {
    switch (crypto) {
        case PredictionCrypto.Bitcoin:
            return <BtcIcon {...rest} />;
        case PredictionCrypto.Ethereum:
            return <EthIcon {...rest} />;
        case PredictionCrypto.Solana:
            return <SolIcon {...rest} />;
        case PredictionCrypto.XRP:
            return <XrpIcon {...rest} />;
        case PredictionCrypto.Dogecoin:
            return <DogeIcon {...rest} />;
        case PredictionCrypto.Hype:
            return <HypeIcon {...rest} />;
        case PredictionCrypto.BNB:
            return <BnbIcon {...rest} />;
        default:
            unreachable(crypto);
    }
}

export function CryptoIconButton({ crypto, selected, onClick }: CryptoIconButtonProps) {
    const color = resolveCryptoColor(crypto);

    return (
        <ClickableButton
            onClick={onClick}
            className={classNames(
                'flex size-[30px] items-center justify-center rounded-md hover:bg-[--crypto-bg] hover:text-[--crypto-color]',
                selected ? 'bg-[--crypto-bg] text-[--crypto-color]' : 'text-second',
            )}
            style={
                {
                    '--crypto-color': color,
                    '--crypto-bg': `${color}1A`,
                } as React.CSSProperties
            }
        >
            <CryptoIcon crypto={crypto} width={18} height={18} />
        </ClickableButton>
    );
}
