'use client';

import PredictionIcon from '@dimensiondev/assets/prediction.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';

import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { waitForAuthorization } from '@/connectors/PrivyConnector.js';
import type { PolymarketRewardNotification } from '@/providers/types/Firefly.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

interface PolymarketRewardNotificationItemProps {
    notification: PolymarketRewardNotification;
}

export function PolymarketRewardNotificationItem({ notification }: PolymarketRewardNotificationItemProps) {
    const handleClick = async () => {
        // Open the in-app wallet (bottom-right) at Prediction > History > Trading Activities,
        // where reward records are listed. Mirrors the OpenOrderItem deep-link flow.
        if (!useFireflyWalletStore.getState().isAuthorized) {
            await waitForAuthorization();
        }
        iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE, {
            path: '/bet/history?tab=trading-activities',
        });
        useGlobalState.getState().updateFireflyWalletIsOpen(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cursor-pointer border-b border-secondaryLine px-4 py-3 hover:bg-bg dark:border-line"
            onClick={handleClick}
        >
            <div className="flex items-center gap-4">
                <PredictionIcon className="shrink-0 text-secondary" width={24} height={24} />
                <div className="min-w-0 flex-1">
                    <div className="text-medium font-medium text-main">
                        <Trans>Rewards have been sent to your Prediction Account.</Trans>
                    </div>
                </div>
                <span className="shrink-0 text-xs leading-4 text-secondary">
                    <TimestampFormatter time={notification.timestamp} />
                </span>
            </div>
        </motion.div>
    );
}
