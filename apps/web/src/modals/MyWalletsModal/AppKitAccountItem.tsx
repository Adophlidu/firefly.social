import EvmIcon from '@dimensiondev/assets/evm.svg';
import SolanaIcon from '@dimensiondev/assets/solana.svg';
import SwitchIcon from '@dimensiondev/assets/switch.svg';
import WalletIcon from '@dimensiondev/assets/wallet.svg';
import { runInSafeAsync } from '@dimensiondev/utils';
import { NetworkType } from '@dimensiondev/web3/enums';
import { formatAddress } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { CoreConnectionController, CoreConnectorController } from '@reown/appkit';
import { type AppKitNetwork, mainnet, solana } from '@reown/appkit/networks';
import type { FunctionComponent, SVGAttributes } from 'react';
import { useAsyncFn } from 'react-use';

import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { appkit } from '@/configs/appkit.js';
import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { ConnectionSource } from '@/constants/enum.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import type { AppKitAccount } from '@/hooks/useAppKitAccounts.js';
import type { ChainNamespace } from '@/types/utility.js';

const IconMap: Record<ChainNamespace, FunctionComponent<SVGAttributes<SVGElement>>> = {
    eip155: EvmIcon,
    solana: SolanaIcon,
    bip122: WalletIcon,
    polkadot: WalletIcon,
    cosmos: WalletIcon,
    sui: WalletIcon,
    ton: WalletIcon,
    stacks: WalletIcon,
    tron: WalletIcon,
};

export function AppKitAccountItem({
    address,
    network,
    namespace,
    connected,
    walletIcon,
    connection,
    source,
    ensName,
    onOpenPrivy,
    ...rest
}: AppKitAccount & {
    ensName?: string;
    onOpenPrivy?: () => void;
}) {
    const Icon = IconMap[namespace] || WalletIcon;

    const [{ loading }, onConnectionClick] = useAsyncFn(async () => {
        try {
            appkit.updateRemoteFeatures({ multiWallet: true });

            if (!connected && !connection && source === ConnectionSource.Privy) {
                const connectors = CoreConnectorController.state.connectors;
                const privyConnector = connectors.find((c) => c.id === PRIVY_CONNECTOR_ID);
                const connector = privyConnector?.connectors?.find((c) => c.chain === namespace);
                if (connector) {
                    await runInSafeAsync(() => CoreConnectionController.connectExternal(connector, namespace));
                }
                onOpenPrivy?.();
                return;
            }

            if (connected || !connection) {
                const appkitNetwork =
                    connection?.caipNetwork ||
                    (network === NetworkType.Solana ? solana : network === NetworkType.Ethereum ? mainnet : null);
                if (appkitNetwork) {
                    await appkit.switchNetwork(appkitNetwork as AppKitNetwork);
                }
                if (source === ConnectionSource.Privy) {
                    onOpenPrivy?.();
                    return;
                }

                await appkit.open({ view: 'Account' });
                return;
            }

            await CoreConnectionController.switchConnection({
                connection,
                address,
                namespace,
                closeModalOnConnect: false,
            });
            if (source === ConnectionSource.Privy) {
                onOpenPrivy?.();
                return;
            }
        } catch (error) {
            enqueueErrorMessage(t`Failed to switch wallet.`);
        }
    }, [address, connection, connected, namespace, network, source, onOpenPrivy]);

    return (
        <ClickableButton
            key={address}
            className="text-main flex h-10 w-full items-center justify-between gap-2 px-2"
            onClick={onConnectionClick}
            disabled={loading}
        >
            <Icon className="shrink-0" width={20} height={20} />
            {walletIcon ? (
                <Image src={walletIcon.trim()} alt="" className="size-5 shrink-0 rounded" width={20} height={20} />
            ) : null}
            <span className="min-w-0 flex-1 truncate text-left">{ensName || formatAddress(address, 4)}</span>
            {rest.isLoading || loading ? (
                <LoadingIcon size={20} />
            ) : connected ? (
                <CircleCheckboxIcon size={20} checked />
            ) : (
                <SwitchIcon width={20} height={20} />
            )}
        </ClickableButton>
    );
}
