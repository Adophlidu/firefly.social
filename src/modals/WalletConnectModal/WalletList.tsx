import { Trans } from '@lingui/react/macro';
import {
    CoreAssetController,
    CoreAssetUtil,
    CoreConnectionController,
    CoreConnectorController,
    CoreHelperUtil,
    CoreRouterController,
    type WcWallet,
} from '@reown/appkit';
import { useRouter } from '@tanstack/react-router';
import { memo, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import urlcat from 'urlcat';

import ScanIcon from '@/assets/scan.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { WalletChainConfig, WalletId } from '@/constants/reown.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import { selectConnector, selectWallet } from '@/modals/WalletConnectModal/selectWallet.js';
import { uniqueWallets } from '@/modals/WalletConnectModal/uniqueWallets.js';
import type { ChainNamespace, ConnectorWithProvider } from '@/types/index.js';

interface WalletItemProps extends ClickableButtonProps {
    icon?: string;
    name?: string;
    chains?: ChainNamespace[];
    installed: boolean;
    tagIcon?: ReactNode;
}

interface ConnectedProps {
    connectors: ConnectorWithProvider[];
}

const chainNameMap: Record<ChainNamespace, string> = {
    eip155: 'EVM',
    solana: 'Solana',
    polkadot: 'Polkadot',
    bip122: 'Bitcoin',
};

const WalletItem = memo<WalletItemProps>(function WalletItem({ icon, name, installed, chains, tagIcon, ...rest }) {
    const isDarkMode = useIsDarkMode();
    const { chainNamespace } = WalletConnectContext.useContainer();
    const fallbackUrl = isDarkMode ? '/image/firefly-dark-avatar.png' : '/image/firefly-light-avatar.png';

    return (
        <ClickableButton
            {...rest}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-secondaryLine p-2 even:bg-lightBg"
        >
            <Image
                src={icon?.trim() || fallbackUrl}
                alt={name || 'Unknown'}
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl border border-secondaryLine"
            />
            <div className="flex flex-1 flex-col items-start text-sm">
                <span className="text-main">{name || 'Unknown'}</span>
                {!chains?.length || chainNamespace ? null : chains.length === 1 ? (
                    <span className="text-secondary">
                        <Trans>Only {chainNameMap[chains[0]]}</Trans>
                    </span>
                ) : (
                    <span className="text-secondary">
                        {chains
                            .sort((chain) => (chain === 'eip155' ? -1 : 1))
                            .map((x) => chainNameMap[x])
                            .join(' & ')}
                    </span>
                )}
            </div>
            {tagIcon ? (
                tagIcon
            ) : installed || rest.disabled ? (
                <span className="flex h-7 items-center rounded bg-success/20 px-1 text-sm text-success">
                    {rest.disabled ? <Trans>Connected</Trans> : <Trans>Installed</Trans>}
                </span>
            ) : null}
        </ClickableButton>
    );
});

export const InjectedWallets = memo<ConnectedProps>(function InjectedWallets({ connectors }) {
    const { history } = useRouter();
    const { connectedId } = WalletConnectContext.useContainer();

    const validConnectors = connectors.filter((x) => x.type === 'INJECTED');

    if (
        !validConnectors.length ||
        (validConnectors.length === 1 && validConnectors[0]?.name === 'Browser Wallet' && !CoreHelperUtil.isMobile())
    )
        return null;

    return validConnectors.map((connector) => {
        if (connector.name === 'Browser Wallet' && !CoreHelperUtil.isMobile()) return null;
        if (!connector.info?.rdns && !CoreConnectionController.checkInstalled()) return null;

        return (
            <WalletItem
                key={connector.id}
                icon={CoreAssetUtil.getConnectorImage(connector)}
                disabled={[connector.id, connector.name].some((x) => connectedId.includes(x))}
                name={connector.name}
                chains={connector.chain ? [connector.chain] : []}
                installed
                onClick={() => {
                    CoreConnectorController.setActiveConnector(connector);
                    CoreRouterController.state.data = { connector };
                    history.push(urlcat('/connecting', { name: encodeURIComponent(connector.name || '') }));
                }}
            />
        );
    });
});

export const FeaturedWallets = memo<{ wallets: WcWallet[] }>(function FeaturedWallets({ wallets }) {
    const validWallets = useMemo(() => uniqueWallets(wallets), [wallets]);

    return validWallets.map((wallet) => (
        <WalletItem
            key={wallet.id}
            icon={CoreAssetUtil.getWalletImage(wallet)}
            chains={WalletChainConfig[wallet.id as WalletId] || []}
            name={wallet.name}
            installed={false}
            onClick={() => {
                selectWallet(wallet);
            }}
        />
    ));
});

export const WalletConnect = memo<ConnectedProps>(function WalletConnect({ connectors }) {
    const { history } = useRouter();
    const [images, setImages] = useState(CoreAssetController.state?.connectorImages || {});

    const connector = useMemo(() => connectors.find((x) => x.id === 'walletConnect'), [connectors]);
    const onConnect = useCallback(() => {
        CoreConnectorController.setActiveConnector(connector);
        history.push(urlcat('/connecting-wc', { name: encodeURIComponent(connector?.name || '') }));
    }, [connector, history]);

    useEffect(
        () =>
            CoreAssetController.subscribeKey('connectorImages', (images) => {
                setImages(images);
            }),
        [],
    );

    if (!connector || CoreHelperUtil.isMobile()) return null;

    const connectorImg = connector.imageUrl || images[connector.imageId ?? ''] || '/image/walletConnect.png';

    return (
        <WalletItem
            icon={connectorImg}
            name={connector.name}
            installed={false}
            onClick={onConnect}
            tagIcon={<ScanIcon width={20} height={20} className="text-main" />}
        />
    );
});

export const MultipleChainWallets = memo<ConnectedProps>(function MultipleChainWallets({ connectors }) {
    const { history } = useRouter();
    const { connectedId } = WalletConnectContext.useContainer();

    const validConnectors = connectors.filter((x) => x.type === 'MULTI_CHAIN' && x.name !== 'WalletConnect');

    return validConnectors.map((connector) => (
        <WalletItem
            key={connector.id}
            icon={CoreAssetUtil.getConnectorImage(connector)}
            name={connector.name}
            chains={connector.connectors?.map((x) => x.chain) || []}
            disabled={connector.connectors?.some(({ id, name }) => [id, name].some((x) => connectedId.includes(x)))}
            installed
            onClick={() => {
                if (connector.connectors?.length === 1 && connector.connectors[0]?.chain) {
                    selectConnector(connector.connectors[0]);
                    return;
                }
                CoreConnectorController.setActiveConnector(connector);
                history.push('/multiple-chain');
            }}
        />
    ));
});

export const AnnouncedWallets = memo<ConnectedProps>(function AnnouncedWallets({ connectors }) {
    const { connectedId } = WalletConnectContext.useContainer();

    const announcedConnectors = connectors.filter((connector) => connector.type === 'ANNOUNCED');

    return announcedConnectors.map((connector) => (
        <WalletItem
            key={connector.id}
            disabled={[connector.id, connector.name].some((x) => connectedId.includes(x))}
            icon={CoreAssetUtil.getConnectorImage(connector)}
            name={connector.name}
            chains={connector.chain ? [connector.chain] : []}
            installed
            onClick={() => {
                selectConnector(connector);
            }}
        />
    ));
});

export const AllWalletsEntry = memo(function AllWalletsEntry() {
    const { history } = useRouter();

    return (
        <ClickableButton
            className="w-full rounded-lg border border-secondaryLine p-2 text-sm leading-6 text-main"
            onClick={() => {
                history.push('/all-wallets');
            }}
        >
            <Trans>All Wallets</Trans>
        </ClickableButton>
    );
});
