import RankingIcon from '@dimensiondev/assets/ranking.svg';
import SettingIcon from '@dimensiondev/assets/setting.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';

import { NavigationBar, NavigationBarRight } from '@/components/NavigationBar.js';
import { ModalType } from '@/configs/modalRoutes.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketSettingQueryOptions } from '@/queries/firefly/getPolymarketSettingQueryOptions.js';

export function BetNavigationBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: account } = useQuery(getPolymarketAccountQueryOptions());
    const { data: setting } = useQuery({
        ...getPolymarketSettingQueryOptions(),
        enabled: !!account,
    });

    const showExportKey = !!account && setting?.export_privatekey !== false;

    const openExportKeyModal = () => {
        navigate({
            to: location.pathname,
            search: { modal: ModalType.ExportBetKey },
            replace: true,
        });
    };

    return (
        <NavigationBar onBack={() => navigate({ to: '/', replace: true })}>
            <Trans>Predictions</Trans>
            <NavigationBarRight>
                <button
                    type="button"
                    onClick={() => {
                        iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
                            path: '/prediction/leaderboard',
                        });
                    }}
                >
                    <RankingIcon width={24} height={24} />
                </button>
                {showExportKey ? (
                    <button type="button" onClick={openExportKeyModal}>
                        <SettingIcon width={24} height={24} />
                    </button>
                ) : null}
            </NavigationBarRight>
        </NavigationBar>
    );
}
