import { Source } from '@dimensiondev/enums';

import { isSameConnectionAddress } from '@/helpers/isSameConnectionAddress.js';
import type {
    AllConnections,
    FireflyIdentity,
    FireflyWalletConnection,
    WalletConnection,
} from '@/providers/types/Firefly.js';

export function flatLenConnections(
    allConnections: AllConnections['lens']['connected'] | AllConnections['lens']['unconnected'],
) {
    return allConnections.flatMap((x) => x.lens);
}

function getRelatedFireflyIdentities(
    connection: WalletConnection,
    { lens, farcaster }: AllConnections,
): FireflyIdentity[] {
    const { address, platform } = connection;
    const identities: FireflyIdentity[] = [];
    if (lens) {
        const connections = flatLenConnections([...lens.connected, ...lens.unconnected]);
        const relatedLens = connections.filter((x) => isSameConnectionAddress(platform, x.ownedBy, address));
        identities.push(...relatedLens.map((x) => ({ id: x.id, source: Source.Lens })));
    }
    if (farcaster) {
        const relatedFarcaster = [...farcaster.connected, ...farcaster.unconnected].filter((x) =>
            x.connectedAddresses?.some((addr) => isSameConnectionAddress(platform, addr, address)),
        );
        identities.push(...relatedFarcaster.map((x) => ({ id: `${x.fid}`, source: Source.Farcaster })));
    }
    return identities;
}

export function formatWalletConnections(
    walletConnections: WalletConnection[],
    allConnections: AllConnections,
): FireflyWalletConnection[] {
    return walletConnections.map((connection) => ({
        ...connection,
        identities: getRelatedFireflyIdentities(connection, allConnections),
    }));
}
