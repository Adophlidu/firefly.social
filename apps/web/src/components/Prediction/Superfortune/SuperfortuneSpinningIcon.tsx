import { memo } from 'react';

interface SuperfortuneSpinningIconProps {
    size?: number;
    className?: string;
}

/**
 * FW-7814 entry logo: a static gradient disc with the inner emblem rotating
 * uniformly (slow, linear, infinite). Only the emblem spins so the gradient shading
 * stays put; honours `prefers-reduced-motion`.
 */
export const SuperfortuneSpinningIcon = memo(function SuperfortuneSpinningIcon({
    size = 24,
    className,
}: SuperfortuneSpinningIconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="12" cy="12" r="12" fill="url(#superfortune_gradient)" />
            <g
                className="animate-spin motion-reduce:animate-none"
                style={{ animationDuration: '8s', transformOrigin: 'center', transformBox: 'fill-box' }}
            >
                <rect
                    x="5.57143"
                    y="5.57143"
                    width="12.8571"
                    height="12.8571"
                    rx="6.42857"
                    stroke="white"
                    strokeWidth="0.857143"
                />
                <path
                    d="M11.9997 16.0001C11.4477 16.0001 10.9997 15.5521 10.9997 15.0001C10.9997 14.4481 11.4477 14.0001 11.9997 14.0001C12.5517 14.0001 12.9997 14.4481 12.9997 15.0001C12.9997 15.5521 12.5517 16.0001 11.9997 16.0001Z"
                    fill="white"
                />
                <path
                    d="M9 15C9 13.344 10.344 12 12 12C13.656 12 15 10.658 15 9C15 7.342 13.74 6.084 12.154 6.004C12.104 6.002 12.052 6 12 6C11.948 6 11.896 6.002 11.846 6.004C8.602 6.084 6 8.738 6 12C6 15.262 8.602 17.916 11.846 17.996C10.262 17.916 9 16.606 9 15ZM12 8C12.552 8 13 8.448 13 9C13 9.552 12.552 10 12 10C11.448 10 11 9.552 11 9C11 8.448 11.448 8 12 8Z"
                    fill="white"
                />
            </g>
            <defs>
                <linearGradient
                    id="superfortune_gradient"
                    x1="12"
                    y1="0"
                    x2="12"
                    y2="24"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#B451CC" />
                    <stop offset="1" stopColor="#9036AD" />
                </linearGradient>
            </defs>
        </svg>
    );
});
