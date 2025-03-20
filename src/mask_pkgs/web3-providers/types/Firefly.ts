export namespace FireflyRedPacketAPI {
    export type ThemeSettings = {
        [key in 'title1' | 'title2' | 'title3' | 'title4' | 'title_symbol']: {
            color: '#F1D590';
            font_size: 55;
            font_family: 'Helvetica';
            font_weight: 700;
            line_height: 63.25;
        };
    } & {
        bg_color: string;
        bg_image: string;
        logo_image: string;
    };

    export interface ThemeGroupSettings {
        /** theme id */
        tid: string;
        cover: ThemeSettings;
        normal: ThemeSettings;
        /** Redpacket without theme settings preset, current ones are default */
        is_default?: boolean;
    }
}
