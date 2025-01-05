import { type ComponentType, memo } from 'react';
import type { Options } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
// @ts-expect-error
import linkifyRegex from 'remark-linkify-regex';

import { Code } from '@/components/Code.js';
import { ImageAsset } from '@/components/Posts/ImageAsset.js';
import { SNAPSHOT_IPFS_GATEWAY_URL } from '@/constants/index.js';
import {
    BIO_TWITTER_PROFILE_REGEX,
    HASHTAG_REGEX,
    MENTION_REGEX,
    SYMBOL_REGEX,
    URL_REGEX,
} from '@/constants/regexp.js';
import { classNames } from '@/helpers/classNames.js';
import { sanitizeDStorageUrl } from '@/helpers/sanitizeDStorageUrl.js';
import { trimify } from '@/helpers/trimify.js';

const img = (props: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) => {
    const src = sanitizeDStorageUrl(props.src, SNAPSHOT_IPFS_GATEWAY_URL);
    return <ImageAsset {...props} src={src} alt={src} width={1000} height={1000} />;
};
export const SnapshotMarkup: ComponentType<Options> = memo<Options>(function SnapshotMarkup({ children, ...rest }) {
    const plugins = [
        remarkBreaks,
        linkifyRegex(MENTION_REGEX),
        linkifyRegex(HASHTAG_REGEX),
        linkifyRegex(SYMBOL_REGEX),
        linkifyRegex(BIO_TWITTER_PROFILE_REGEX),
        linkifyRegex(URL_REGEX),
    ];

    return (
        <ReactMarkdown
            {...rest}
            className={classNames('snapshot-markup', rest.className)}
            remarkPlugins={plugins}
            components={{
                code: Code,
                img,
                ...rest.components,
            }}
        >
            {trimify(children || '')}
        </ReactMarkdown>
    );
});
