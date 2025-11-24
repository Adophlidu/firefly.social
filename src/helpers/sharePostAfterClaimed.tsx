import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import urlcat from 'urlcat';

import CircleSuccessIcon from '@/assets/circle-success.svg';
import { SITE_URL } from '@/constants/index.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function sharePostAfterClaimed(post: Post, amount: string, symbol?: string) {
    const postUrl = urlcat(SITE_URL, getPostUrl(post));

    ConfirmModalRef.open({
        title: <Trans>Lucky Drop</Trans>,
        content: (
            <div className="flex h-[276px] w-[388px] flex-col items-center max-md:w-auto">
                <CircleSuccessIcon width={90} height={90} />
                <div className="mt-3 text-xl font-bold leading-6 text-success">
                    <Trans>Congratulations!</Trans>
                </div>
                <div className="mt-10 text-base font-bold leading-5 text-main">
                    {amount ? (
                        <Trans>
                            Your claimed {amount} {symbol}.
                        </Trans>
                    ) : (
                        <Trans>Claimed successfully.</Trans>
                    )}
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
