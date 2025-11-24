import { parseUrl } from '@dimensiondev/utils';

import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { PureLink } from '@/components/Posts/PureLink.js';
import { isSelfReference } from '@/helpers/isLinkMatchingHost.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import type { OpenGraph } from '@/types/og.js';

interface EmbedProps {
    og: OpenGraph;
}

export function Embed({ og }: EmbedProps) {
    const u = parseUrl(og.url);
    if (!u) return null;

    const imageProps = og.image
        ? {
              width: og.image.width,
              height: og.image.height,
              src: og.image.url,
          }
        : null;

    if (!imageProps) {
        return (
            <PureLink
                url={og.url}
                title={og.title || u.host}
                description={og.description || u.hostname}
                className="mt-2"
            />
        );
    }

    return (
        <article className="mt-4 max-w-full text-sm">
            <Link
                onClick={stopPropagation}
                href={og.url}
                target={isSelfReference(og.url) ? '_self' : '_blank'}
                rel="noreferrer noopener"
            >
                <div className="rounded-xl border border-line bg-white text-main dark:bg-black">
                    {og.isLarge ? (
                        <Image
                            className="aspect-[16/9] w-full rounded-t-xl object-cover"
                            unoptimized
                            {...imageProps}
                            fallback="square"
                            alt=""
                        />
                    ) : null}
                    <div className="flex items-center">
                        {!og.isLarge ? (
                            <div className="relative flex aspect-square h-[90px] shrink-0 items-center justify-center md:h-36">
                                <Image
                                    className="aspect-square h-[144px] rounded-l-xl border-r border-line object-cover"
                                    layout="fill"
                                    src={imageProps.src}
                                    unoptimized
                                    fallback="square"
                                    alt=""
                                />
                            </div>
                        ) : null}
                        <div className="truncate px-3 py-2 text-left text-second">
                            <div className="line-clamp-1 max-w-full text-base font-semibold text-main first-letter:uppercase">
                                {og.title || u.host}
                            </div>
                            <div className="line-clamp-1 max-w-full text-sm font-medium text-highlight">
                                {u?.hostname || og.url}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    );
}
