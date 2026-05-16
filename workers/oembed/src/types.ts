export interface OpenGraph {
    type: 'website';
    url: string;
    favicon: string;
    title: string | null;
    description: string | null;
    site: string | null;
    image: OpenGraphImage | null;
    isLarge: boolean;
    html: string | null;
    locale: string | null;
}

export interface OpenGraphImage {
    url: string;
    width: number;
    height: number;
}

export interface LinkDigested {
    og: OpenGraph;
}

export interface ImageDigested {
    width: number;
    height: number;
}
