import SettingIcon from '@dimensiondev/assets/setting.svg';
import { Trans } from '@lingui/react/macro';
import { useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';

import { NavigationBar, NavigationBarRight } from '@/components/NavigationBar.js';
import { SwapSettings } from '@/components/SwapUI/SwapSettings.js';
import { Button } from '@/components/ui/button.js';
import { isCrossChainAtom, resetSwapWalletContext } from '@/store/swap/swapState.js';

export function SwapNavigationBar() {
    const navigate = useNavigate();
    const isCrossChain = useAtomValue(isCrossChainAtom);
    const resetContext = useSetAtom(resetSwapWalletContext);

    const handleBack = () => {
        resetContext();
        navigate({ to: '/', replace: true });
    };

    return (
        <NavigationBar onBack={handleBack}>
            {isCrossChain ? <Trans>Bridge</Trans> : <Trans>Swap</Trans>}
            <NavigationBarRight>
                <SwapSettings
                    trigger={
                        <Button variant="ghost" size="icon" className="[&_svg]:size-6">
                            <SettingIcon width={24} height={24} />
                        </Button>
                    }
                />
            </NavigationBarRight>
        </NavigationBar>
    );
}
