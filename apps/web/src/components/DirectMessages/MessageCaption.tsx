import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

interface MessageCaptionProps {
    content: string;
    // 'attached' sits inside a media card and supplies its own padding; 'detached' hangs below a
    // sticker/tip card with top margin instead.
    variant: 'attached' | 'detached';
}

export const MessageCaption = memo(function MessageCaption({ content, variant }: MessageCaptionProps) {
    if (!content) return null;

    return (
        <p
            className={classNames('max-w-full break-words text-sm leading-5 text-main [overflow-wrap:anywhere]', {
                'px-3 py-2': variant === 'attached',
                'mt-1': variant === 'detached',
            })}
        >
            {content}
        </p>
    );
});
