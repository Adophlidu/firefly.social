'use client';

import { Trans } from '@lingui/react/macro';

import { readChars } from '@/helpers/chars.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import type { CompositePost } from '@/types/compose.js';

interface PlaceholderProps {
    post: CompositePost;
}

export function Placeholder(props: PlaceholderProps) {
    const { posts } = useComposeStateStore();

    const index = posts.findIndex((x) => x.id === props.post.id);
    const content = readChars({ chars: props.post.chars, strategy: 'visible' });

    return (
        <div className="cursor-text resize-none appearance-none whitespace-pre-wrap break-all border-none bg-transparent p-0 text-left text-medium leading-5 text-main outline-0 focus:ring-0">
            {content ? (
                content
            ) : (
                <span className="text-secondary">
                    {props.post.poll ? (
                        <Trans>Ask a question</Trans>
                    ) : index === 0 ? (
                        <Trans>What&apos;s happening...</Trans>
                    ) : (
                        <Trans>Add another post...</Trans>
                    )}
                </span>
            )}
        </div>
    );
}
