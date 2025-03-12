import { safeUnreachable } from '@masknet/kit';

import { ConnectionPlatform, type SocialSource, Source, WalletSource } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveConnectionPlatform } from '@/helpers/resolveConnectionPlatform.js';
import { resolveSourceFromWalletSource } from '@/helpers/resolveSource.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { FireflyIdentity, FireflyWalletConnection } from '@/providers/types/Firefly.js';
import { removeAccountByProfileId } from '@/services/account.js';

function getIdentity(connection: FireflyWalletConnection): FireflyIdentity | null {
    switch (connection.source) {
        case WalletSource.Lens:
        case WalletSource.Farcaster:
        case WalletSource.LensContract:
            const identity = connection.identities.find(
                (x) => x.source === resolveSourceFromWalletSource(connection.source),
            );
            return identity ? { source: resolveSourceFromWalletSource(connection.source), id: identity.id } : null;
        case WalletSource.Twitter:
            return { source: resolveSourceFromWalletSource(connection.source), id: connection.twitterId };
        case WalletSource.Article:
        case WalletSource.NFTs:
        case WalletSource.Particle:
            return null;
        case WalletSource.Firefly:
        case WalletSource.Wallet:
            return { source: Source.Wallet, id: connection.address };
        default:
            safeUnreachable(connection.source);
            return null;
    }
}

export async function disconnectFirefly(connection: FireflyWalletConnection) {
    const identity = getIdentity(connection);
    if (!identity) return;
    await FireflyEndpointProvider.disconnectAccount(
        identity.id,
        isSocialSource(identity.source)
            ? resolveConnectionPlatform(resolveSocialSourceInUrl(identity.source))
            : resolveConnectionPlatform(connection.platform),
    );
    if (isSocialSource(identity.source) && connection.address && connection.platform === 'eth') {
        await FireflyEndpointProvider.disconnectAccount(connection.address, ConnectionPlatform.Wallet);
    }
    const source = identity.source as SocialSource;
    if (SORTED_SOCIAL_SOURCES.includes(source)) {
        await removeAccountByProfileId(source, identity.id);
    }
}
