declare module 'swiper/css';
declare module 'swiper/css/autoplay';
declare module 'swiper/css/effect-coverflow';
declare module 'swiper/css/keyboard';
declare module 'swiper/css/navigation';
declare module 'swiper/css/pagination';

declare module 'd3-shape' {
    export const curveMonotoneX: unknown;

    interface LineGenerator<T> {
        x(accessor: (datum: T) => number): LineGenerator<T>;
        y(accessor: (datum: T) => number): LineGenerator<T>;
        curve(curve: unknown): LineGenerator<T>;
        (data: T[]): string | null;
    }

    export function line<T>(): LineGenerator<T>;
}
