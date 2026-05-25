'use client';

import FlagIcon from '@dimensiondev/assets/flag.svg';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import type { ClickableButtonProps } from '@/components/ClickableButton.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { reportArticle } from '@/providers/firefly/report/reportArticle.js';
import type { Article } from '@/providers/types/Article.js';

interface Props extends Omit<ClickableButtonProps, 'children'> {
    article: Article;
}

export function ReportArticleButton({ article, ref, onClick, ...rest }: Props) {
    const mutation = useMutation({
        mutationFn: async () => {
            await reportArticle(article);
            enqueueSuccessMessage(<Trans>Report submitted</Trans>);
        },
    });
    return (
        <MenuButton
            {...rest}
            onClick={async (event) => {
                onClick?.(event);
                const confirmed = await ConfirmModalRef.openAndWaitForClose({
                    title: <Trans>Report article</Trans>,
                    content: (
                        <div className="text-main">
                            <Trans>Are you sure you want to report this article?</Trans>
                        </div>
                    ),
                    variant: 'normal',
                });
                if (!confirmed) return;

                try {
                    await mutation.mutateAsync();
                } catch (error) {
                    enqueueMessageFromError(error, <Trans>Failed to report @{article.title}.</Trans>);
                    throw error;
                }
            }}
            ref={ref}
        >
            <FlagIcon width={18} height={18} />
            <span className="font-bold leading-[22px] text-main">
                <Trans>Report article</Trans>
            </span>
        </MenuButton>
    );
}
