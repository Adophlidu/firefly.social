import RankingIcon from '@dimensiondev/assets/ranking.svg';
import SettingIcon from '@dimensiondev/assets/setting.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { useNavigate, useRouterState } from '@dimensiondev/ssr';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { NavigationBar, NavigationBarRight } from '@/components/NavigationBar.js';
import { ModalType } from '@/configs/modalRoutes.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketSettingQueryOptions } from '@/queries/firefly/getPolymarketSettingQueryOptions.js';

interface Props {
    hideActions?: boolean;
    hideExportKey?: boolean;
    title?: ReactNode;
    onBack?: () => void;
}

export function BetNavigationBar({ hideActions, hideExportKey, title, onBack }: Props) {
    const navigate = useNavigate();
    const { pathname, search } = useRouterState();
    const { data: account } = useQuery(getPolymarketAccountQueryOptions());
    const { data: setting } = useQuery({
        ...getPolymarketSettingQueryOptions(),
        enabled: !!account,
    });

    const showExportKey = !hideExportKey && !!account && setting?.export_privatekey !== false;

    const openExportKeyModal = () => {
        const params = new URLSearchParams(search);
        params.set('modal', ModalType.ExportBetKey);
        navigate(`${pathname}?${params.toString()}`, { replace: true });
    };

    return (
        <NavigationBar onBack={onBack ?? (() => navigate('/', { replace: true }))}>
            {title ?? <Trans>Predictions</Trans>}
            {!hideActions ? (
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
            ) : null}
        </NavigationBar>
    );
}
