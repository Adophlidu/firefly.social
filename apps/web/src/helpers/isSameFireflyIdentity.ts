import { Source } from '@dimensiondev/enums';
import { isSameEthereumAddress, isSameSolanaAddress } from '@dimensiondev/web3/utils';

import type { FireflyIdentity } from '@/providers/types/Firefly.js';

export function isSameFireflyIdentity(identity?: FireflyIdentity, otherIdentity?: FireflyIdentity) {
    if (!identity || !otherIdentity) return false;

    if (identity.source === Source.Wallet || otherIdentity.source === Source.Wallet) {
        return (
            isSameEthereumAddress(identity.id, otherIdentity.id) ||
            isSameSolanaAddress(identity.id, otherIdentity.id, false)
        );
    }

    return identity.source === otherIdentity.source && identity.id === otherIdentity.id;
}
