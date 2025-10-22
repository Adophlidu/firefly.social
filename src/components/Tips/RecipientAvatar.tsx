import { memo } from 'react';

import EvmDashIcon from '@/assets/evm-dash.svg';
import WalletIcon from '@/assets/wallet-icon.svg';
import { Image } from '@/components/Image.js';
import { NetworkPluginID, NetworkType } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { type TipsProfile } from '@/hooks/useTipsContext.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

const solanaNetworkDescriptor = getNetworkDescriptor(NetworkPluginID.PLUGIN_SOLANA, SolanaChainId.Mainnet);

interface RecipientAvatarProps {
    recipient: TipsProfile;
}

export const RecipientAvatar = memo<RecipientAvatarProps>(function RecipientAvatar({ recipient }) {
    const ensAvatar = recipient.ens ? recipient.avatar : null;
    const isEvm = recipient.networkType === NetworkType.Ethereum;

    return (
        <div className="relative size-9">
            <div
                className={classNames(
                    'flex size-full items-center justify-center rounded-full',
                    !ensAvatar ? 'bg-[#5E69FF] text-white' : '',
                )}
                style={{
                    boxShadow: '0px 8px 16px 0px rgba(28, 104, 243, 0.20)',
                    backdropFilter: 'blur(11px)',
                }}
            >
                {ensAvatar ? (
                    <Image
                        width={36}
                        height={36}
                        alt={recipient.displayName || 'Tip'}
                        src={ensAvatar}
                        className="size-full rounded-full object-cover"
                    />
                ) : (
                    <WalletIcon width={24} height={24} />
                )}
            </div>
            <div
                className={classNames(
                    'absolute -right-1 bottom-0 z-1 size-4 rounded-full border border-white',
                    isEvm ? 'bg-[#312B37]' : '',
                )}
            >
                {isEvm ? (
                    <EvmDashIcon width={14} height={14} />
                ) : solanaNetworkDescriptor?.icon ? (
                    <Image
                        width={14}
                        height={14}
                        className="size-full"
                        alt={recipient.networkType}
                        src={solanaNetworkDescriptor.icon}
                    />
                ) : null}
            </div>
        </div>
    );
});
