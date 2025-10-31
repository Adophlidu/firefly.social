import { classNames } from '@dimensiondev/utils';

import CardBg from '@/assets/card-bg.svg';

interface CardProps extends React.HTMLProps<HTMLDivElement> {}

export function Card({ className, children }: CardProps) {
    return (
        <div
            className={classNames('relative max-h-[90%] w-[90vw] md:h-[680px] md:w-[544px]', className)}
            style={{
                aspectRatio: '544 / 680',
            }}
        >
            <CardBg preserveAspectRatio="none" width={'100%'} height={'100%'} className="absolute inset-0" />
            <div className="absolute inset-0 z-1">{children}</div>
        </div>
    );
}
