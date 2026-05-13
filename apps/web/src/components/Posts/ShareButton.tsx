import '@/components/Posts/ShareButton.css';

import Send2Icon from '@dimensiondev/assets/send2.svg';
import Send2FilledIcon from '@dimensiondev/assets/send2filled.svg';
import { createContext, use, useRef } from 'react';

export const ShareButtonWithAnimationContext = createContext(false);
export function ShareButtonWithAnimation() {
    const ref = useRef<HTMLElement>(null);
    const hover = use(ShareButtonWithAnimationContext);
    const animate = hover;
    return (
        <span ref={ref} className={animate ? 'size-6' : 'size-6 p-1'}>
            {animate ? (
                <span className="absolute -ml-3 size-6" style={{ clipPath: 'circle(40% at 50% 50%)' }}>
                    <Send2FilledIcon width={23} height={23} className="airplane-r1-animation" />
                    <Send2FilledIcon width={23} height={23} className="airplane-r2-animation absolute top-0" />
                </span>
            ) : (
                <Send2Icon width={16} height={16} />
            )}
        </span>
    );
}
