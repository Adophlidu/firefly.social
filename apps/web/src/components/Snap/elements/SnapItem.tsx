import { Image } from '@/components/Image.js';
import { type SnapItemProps } from '@/types/snap.js';

interface Props {
    props: SnapItemProps;
    onPress?: () => void;
}

export function SnapItem({ props: { title, description, imageUrl }, onPress }: Props) {
    return (
        <div
            className="flex items-center gap-3 py-2"
            onClick={onPress}
            role={onPress ? 'button' : undefined}
            tabIndex={onPress ? 0 : undefined}
        >
            {imageUrl ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                    <Image src={imageUrl} alt={title} fill className="object-cover" unoptimized sizes="40px" />
                </div>
            ) : null}
            <div className="min-w-0 flex-1">
                <p className="text-main truncate text-sm font-medium">{title}</p>
                {description ? <p className="text-secondary truncate text-xs">{description}</p> : null}
            </div>
        </div>
    );
}
