import '@/components/Posts/ShareButton.css';

import Send2Icon from '@dimensiondev/assets/send2.svg';
import Send2FilledIcon from '@dimensiondev/assets/send2filled.svg';
import { createContext, memo, use, useRef } from 'react';

export const ShareButtonWithAnimationContext = createContext(false);
export const ShareButtonWithAnimation = memo(function ShareButtonWithAnimation() {
    const ref = useRef<HTMLElement>(null);
    const hover = use(ShareButtonWithAnimationContext);
    const animate = hover;
    return (
        <span ref={ref} className={animate ? 'size-6' : 'size-6 pt-0.5'}>
            {animate ? (
                <span className="absolute -ml-4 -mt-0.5 size-6" style={{ clipPath: 'circle(40% at 50% 50%)' }}>
                    <Send2FilledIcon width={27} height={27} className="airplane-r1-animation" />
                    <Send2FilledIcon width={27} height={27} className="airplane-r2-animation absolute top-0" />
                </span>
            ) : (
                <Send2Icon width={20} height={20} />
            )}
        </span>
    );
});
