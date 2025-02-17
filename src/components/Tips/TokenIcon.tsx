import { TokenIcon as GenericTokenIcon } from '@/components/TokenIcon.js';
import type { Token } from '@/providers/types/Transfer.js';

interface TokenIconProps {
    token: Token;
    tokenSize?: number;
    chainSize?: number;
    disableChainIcon?: boolean;
}

export function TokenIcon({ token, tokenSize = 30, chainSize = 12, disableChainIcon = false }: TokenIconProps) {
    return (
        <GenericTokenIcon
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
