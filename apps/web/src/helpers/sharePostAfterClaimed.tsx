import CircleSuccessIcon from '@dimensiondev/assets/circle-success.svg';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import urlcat from 'urlcat';

import type { NetworkType } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/static.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { useOpenFireflyWallet } from '@/hooks/useOpenFireflyWallet.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface ShareOptions {
    post: Post;
    amount: string;
    chainId?: number;
    networkType: NetworkType;
    symbol?: string;
    txHash?: string;
}

interface Props extends Omit<ShareOptions, 'post'> {}

function ClaimMessage({ amount, symbol, networkType, chainId, txHash }: Props) {
    const openFireflyWallet = useOpenFireflyWallet();
    return (
        <Trans>
            You claimed {amount} {symbol} to your{' '}
            <span
                className="text-highlight cursor-pointer"
                onClick={() => {
                    openFireflyWallet({
                        path: urlcat('/transactions', { chain: chainId, tx: txHash, network: networkType }),
                    });
                }}
            >
                Firefly Wallet
            </span>
            .
        </Trans>
    );
}

export function sharePostAfterClaimed({ post, ...rest }: ShareOptions) {
    const postUrl = urlcat(SITE_URL, getPostUrl(post));

    ConfirmModalRef.open({
        title: <Trans>Lucky Drop</Trans>,
        content: (
            <div className="flex h-[276px] w-[388px] flex-col items-center max-md:w-auto">
                <CircleSuccessIcon width={90} height={90} />
                <div className="text-success mt-3 text-xl font-bold leading-6">
                    <Trans>Congratulations!</Trans>
                </div>
                <div className="text-main mt-10 text-base font-bold leading-5">
                    {rest.amount ? <ClaimMessage {...rest} /> : <Trans>Claimed successfully.</Trans>}
                </div>
            </div>
        ),
        resetSize: true,
        contentStyle: { justifyContent: 'space-between' },
        modalStyle: { width: 420, height: 420, maxWidth: '80%', maxHeight: '80%' },
        enableConfirmButton: true,
        variant: 'normal',
        confirmButtonText: <Trans>Share</Trans>,
        onConfirm: () => {
            openComposeModal({
                type: 'compose',
                source: post.source,
                chars: [
                    t`🤑 Just claimed a #FireflyLuckyDrop 🧧💰✨ on ${postUrl} from @${post.author.handle} !`,
                    ' \n\n',
                    t`Grow your followers and engagement with Lucky Drop on Firefly!`,
                ],
            });
        },
    });
}
