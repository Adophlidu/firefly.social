import EvmDashIcon from '@dimensiondev/assets/evm-dash.svg';
import WalletIcon from '@dimensiondev/assets/wallet-icon.svg';
import { NetworkType } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { getChainIcon, solana } from '@dimensiondev/web3/chains';
import { memo } from 'react';

import { Image } from '@/components/Image.js';
import type { FireflyTipsProfile } from '@/providers/types/Firefly.js';

const icon = getChainIcon(solana.id);

interface RecipientAvatarProps {
    recipient: FireflyTipsProfile;
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
                    'z-1 absolute -right-1 bottom-0 size-4 rounded-full border border-white',
                    isEvm ? 'bg-[#312B37]' : '',
                )}
            >
                {isEvm ? (
                    <EvmDashIcon width={14} height={14} />
                ) : icon ? (
                    <Image width={14} height={14} className="size-full" alt={recipient.networkType} src={icon} />
                ) : null}
            </div>
        </div>
    );
});
