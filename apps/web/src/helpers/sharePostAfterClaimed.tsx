import CircleSuccessIcon from '@dimensiondev/assets/circle-success.svg';
import type { NetworkType } from '@dimensiondev/enums';
import { SessionType } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import urlcat from 'urlcat';

import { openComposeModal } from '@/controllers/openComposeModal.js';
import { openConfirmModal } from '@/controllers/openConfirmModal.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { addSharerParam } from '@/helpers/sharerUrl.js';
import { useOpenFireflyWallet } from '@/hooks/useOpenFireflyWallet.js';
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
                className="cursor-pointer text-highlight"
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
    const uid = getSessionFromStorage(SessionType.Firefly)?.payload?.uid;
    const postUrl = addSharerParam(urlcat(SITE_URL, getPostUrl(post)), uid);

    openConfirmModal({
        title: <Trans>Lucky Drop</Trans>,
        content: (
            <div className="flex h-[276px] w-[388px] flex-col items-center max-md:w-auto">
                <CircleSuccessIcon width={90} height={90} />
                <div className="mt-3 text-xl font-bold leading-6 text-success">
                    <Trans>Congratulations!</Trans>
                </div>
                <div className="mt-10 text-base font-bold leading-5 text-main">
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
