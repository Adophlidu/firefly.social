import { classNames } from '@firefly/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';
import { polygon } from 'viem/chains';
import { useChainId, useSwitchChain } from 'wagmi';

import RedPacketIcon from '@/assets/red-packet.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { ENABLED_RP_SOURCES, LENS_CHAIN_ID } from '@/constants/index.js';
import { resolveSourcesName } from '@/helpers/resolveSourceName.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { RedPacketModalRef } from '@/modals/RedPacketModal/index.js';
import { captureRedPacketClickEvent } from '@/providers/telemetry/captureClickEvent.js';

interface RedPacketActionProps extends ClickableButtonProps {}

export const RedPacketAction = memo<RedPacketActionProps>(function RedPacketAction({ disabled = false }) {
    const { availableSources } = useCompositePost();
    const { ethereum, solana } = useWalletAccountAll();
    const chainId = useChainId();
    const { switchChainAsync } = useSwitchChain();

    const [{ loading }, openRedPacketComposeDialog] = useAsyncFn(async () => {
        if (!ethereum.address && !solana.address) {
            ethereum.connect();
            return;
        }
        // rp does not support lens chain
        if (ethereum.address && chainId === LENS_CHAIN_ID) {
            await switchChainAsync({ chainId: polygon.id });
        }

        RedPacketModalRef.open();
        captureRedPacketClickEvent();
    }, [solana.address, ethereum, chainId, switchChainAsync]);

    const invalidSources = availableSources.filter((x) => !ENABLED_RP_SOURCES.includes(x));
    const rpDisabled = disabled || !!invalidSources.length || !availableSources.length;

    const content = (
        <ClickableButton
            aria-disabled={rpDisabled}
            className={classNames('size-5', {
                'cursor-wait opacity-50': loading,
                'cursor-not-allowed opacity-50': !loading && rpDisabled,
                'cursor-pointer': !rpDisabled,
            })}
            onClick={() => {
                if (rpDisabled) return;
                openRedPacketComposeDialog();
            }}
        >
            <RedPacketIcon width={20} height={20} />
        </ClickableButton>
    );

    if (invalidSources.length) {
        return (
            <Tooltip
                placement="top"
                content={<Trans>Lucky drop for {resolveSourcesName(invalidSources)} is coming soon.</Trans>}
            >
                {content}
            </Tooltip>
        );
    }

    return content;
});
