import { TokenIcon as GenericTokenIcon, type TokenIconProps } from '@/components/TokenIcon.js';
import type { Token } from '@/providers/types/Transfer.js';

interface Props extends TokenIconProps {
    token: Pick<Token, 'id' | 'chainId' | 'name' | 'logo_url' | 'chainLogoUrl'>;
    tokenSize?: number;
    chainSize?: number;
    disableChainIcon?: boolean;
}

export function TokenIcon({ token, tokenSize = 30, chainSize = 12, disableChainIcon = false, ...rest }: Props) {
    return (
        <GenericTokenIcon
            {...rest}
            key={token.id}
            chainId={token.chainId}
            name={token.name}
            icon={token.logo_url}
            badgeIcon={token.chainLogoUrl}
            size={tokenSize}
            badgeSize={chainSize}
            disableBadge={disableChainIcon}
        />
    );
}
