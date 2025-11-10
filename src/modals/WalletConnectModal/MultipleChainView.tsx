import { Trans } from '@lingui/react/macro';
import {
    type Connector,
    CoreAssetUtil,
    CoreConnectorController,
    CoreHelperUtil,
    CoreRouterController,
} from '@reown/appkit';
import { memo, useSyncExternalStore } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { resolveAppKitNetworkName } from '@/helpers/resolveAppKitNetworkName.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import { checkIfConnectedAndSwitch } from '@/modals/WalletConnectModal/checkIfConnectedAndSwitch.js';
import { walletRouter } from '@/modals/WalletConnectModal/routes.js';
import { captureConnectWalletSubmit } from '@/providers/telemetry/captureConnectWalletSubmit.js';

export default memo(function MultipleChainView() {
    const { connectedId, origin } = WalletConnectContext.useContainer();

    const connectorState = useSyncExternalStore(CoreConnectorController.subscribe, () => CoreConnectorController.state);
    const activeConnector = connectorState.activeConnector;

    const [{ loading }, onConnect] = useAsyncFn(
        async (provider: Connector) => {
            const connector = activeConnector?.connectors?.find((p) => p.chain === provider.chain);
            if (!connector) {
                enqueueErrorMessage(<Trans>No connector found for {provider.chain}</Trans>);
                return;
            }

            if (await checkIfConnectedAndSwitch(connector, connectedId)) {
                return;
            }

            if (connector.id === 'walletConnect') {
                walletRouter.navigate({ to: CoreHelperUtil.isMobile() ? '/all-wallets' : '/connecting-wc' });
            } else {
                CoreRouterController.state.data = { connector };
                walletRouter.navigate({
                    to: urlcat('/connecting', {
                        name: encodeURIComponent(connector.name),
                    }),
                });
            }
        },
        [activeConnector, connectedId],
    );

    if (!activeConnector) return null;

    const connectorImage = CoreAssetUtil.getConnectorImage(activeConnector)?.trim();

    return (
        <div className="flex flex-col items-center gap-5 p-5 pt-3.5">
            {connectorImage ? (
                <Image width={80} height={80} className="size-20" src={connectorImage} alt={activeConnector.name} />
            ) : null}
            <div className="flex flex-col items-center gap-2 text-medium">
                <span className="font-medium text-main">
                    <Trans>Select Chain for {activeConnector.name}</Trans>
                </span>
                <span className="text-second">
                    <Trans>Select which chain to connect to your multi chain wallet</Trans>
                </span>
            </div>
            <div className="flex w-full flex-col gap-2">
                {activeConnector.connectors?.map((connector) => {
                    const chainImage = CoreAssetUtil.getChainImage(connector.chain);

                    return (
                        <ClickableButton
                            disabled={loading}
                            className="flex items-center gap-3 rounded bg-lightBg py-[7px] pl-2 pr-4 hover:bg-highlight/20"
                            key={connector.chain}
                            onClick={() => {
                                onConnect(connector);
                                captureConnectWalletSubmit({
                                    origin,
                                    name: connector.name,
                                    chain: connector.chain,
                                    connect_time: Date.now(),
                                });
                            }}
                        >
                            {chainImage ? (
                                <Image
                                    width={40}
                                    height={40}
                                    src={chainImage}
                                    alt={connector.name}
                                    className="size-10 rounded"
                                />
                            ) : null}
                            <span>{resolveAppKitNetworkName(connector.chain)}</span>
                        </ClickableButton>
                    );
                })}
            </div>
        </div>
    );
});
