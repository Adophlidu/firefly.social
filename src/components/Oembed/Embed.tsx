import { Link } from '@/components/Link.js';
import { PureLink } from '@/components/Posts/PureLink.js';
import { Image } from '@/esm/Image.js';
import { isSelfReference } from '@/helpers/isLinkMatchingHost.js';
import { parseUrl } from '@/helpers/parseUrl.js';
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
                            className="divider aspect-[16/9] w-full rounded-t-xl object-cover"
                            unoptimized
                            {...imageProps}
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
                                    alt=""
                                />
                            </div>
                        ) : null}
                        <div className="truncate p-2 text-left text-second md:p-5">
                            <div className="space-y-1.5">
                                <div className="truncate font-bold">{og.title || u.host}</div>
                                {og.description || u.hostname ? (
                                    <div className="ld-text-gray-500 line-clamp-1 whitespace-break-spaces">
                                        {og.description || u.hostname}
                                    </div>
                                ) : null}
                                {og.site ? (
                                    <div className="flex items-center space-x-2 pt-1.5">
                                        {og.favicon ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                className="size-4 rounded-full"
                                                height={16}
                                                width={16}
                                                src={og.favicon}
                                                alt="Favicon"
                                            />
                                        ) : null}
                                        <div className="ld-text-gray-500 text-xs">{og.site}</div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    );
}
