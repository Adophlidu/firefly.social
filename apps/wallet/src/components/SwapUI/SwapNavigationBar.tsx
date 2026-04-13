import SettingIcon from '@dimensiondev/assets/setting.svg';
import { Trans } from '@lingui/react/macro';
import { useAtomValue, useSetAtom } from 'jotai';

import { NavigationBar, NavigationBarRight } from '@/components/NavigationBar.js';
import { SwapSettings } from '@/components/SwapUI/SwapSettings.js';
import { Button } from '@/components/ui/button.js';
import { useComeback } from '@/components/useComeback.js';
import { isCrossChainAtom, resetSwapWalletContext } from '@/store/swap/swapState.js';

export function SwapNavigationBar() {
    const isCrossChain = useAtomValue(isCrossChainAtom);
    const resetContext = useSetAtom(resetSwapWalletContext);
    const comeback = useComeback();

    const handleBack = () => {
        resetContext();
        comeback();
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
