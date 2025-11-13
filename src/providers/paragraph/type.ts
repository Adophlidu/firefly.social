export interface ParagraphJSONContent {
    type: string;
    attrs?: {
        tweetData?: {
            video?: {
                poster: string;
                variants: Array<{ type: string; src: string }>;
            };
        };
    };
    content: Array<{
        attrs?: {
            nextheight?: number;
            nextwidth?: number;
            src: string;
        };
    }>;
}
