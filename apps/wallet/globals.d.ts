declare module '*.svg' {
    const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.css';

declare module '*.svg?url' {
    const content: string;
    export default content;
}

declare module 'urlcat' {
    type ParamMap = Record<string, unknown>;
    function urlcat(baseTemplate: string, params: ParamMap): string;
    function urlcat(baseURL: string, template: string): string;
    function urlcat(baseURL: string, template: string, params: ParamMap): string;
    export default urlcat;
}

declare module 'dayjs/plugin/relativeTime.js' {
    import type { PluginFunc } from 'dayjs';

    const plugin: PluginFunc;
    export default plugin;
}
