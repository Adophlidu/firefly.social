import { memo } from 'react';

import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { type Project } from '@/providers/types/Firefly.js';

export const ProjectItem = memo<{ project: Project }>(function ProjectItem({
    project: { project_name, logo, token_symbol, tags, one_liner, rootdataurl },
}) {
    return (
        <Link
            target="_blank"
            rel="noreferrer noopener"
            className="border-line hover:bg-bg flex gap-x-2 border-b px-3 py-2"
            href={rootdataurl}
        >
            <Image className="size-11 shrink-0 rounded-full" width={44} height={44} src={logo} alt={project_name} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-1 text-lg font-bold leading-6">
                    <div className="text-lightMain">{project_name}</div>
                    <div className="text-secondary">{token_symbol}</div>
                </div>
                <div className="flex flex-wrap items-center gap-x-1">
                    {tags.map((tag, index) => (
                        <div
                            className="bg-lightBg text-secondary flex items-center gap-x-1 break-keep rounded-lg p-1 text-xs"
                            key={index}
                        >
                            #{tag}
                        </div>
                    ))}
                </div>
                <div className="text-medium line-clamp-2 leading-[22px]">{one_liner}</div>
            </div>
        </Link>
    );
});
