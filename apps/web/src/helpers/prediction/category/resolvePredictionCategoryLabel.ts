import { Locale } from '@dimensiondev/enums';

/**
 * Frontend translations for prediction category labels.
 *
 * The backend (`/v1/polymarket/slugs/list`) only returns English labels and does not
 * support i18n yet. Until it does, we keep a hardcoded per-locale dictionary keyed by
 * the English label. When a translation exists for the active locale it is used,
 * otherwise we fall back to the raw label returned by the backend.
 *
 * Kept self-contained (instead of going through Lingui/Tolgee) so the tabs are
 * translated immediately and a generic word like "New" does not inherit an unrelated
 * translation from the shared message catalog.
 *
 * Keyed by the English label (not the slug) so the same slug can resolve to different
 * labels — e.g. `fifwc` is shown as "FIFA" in the primary tab strip (see
 * `partitionPrimaryCategorySlugs`) but as "World Cup" elsewhere.
 *
 * Only labels whose translation differs from the English source are listed; proper
 * nouns / abbreviations (NBA, NFL, UFC, FIFA, …) fall through to the backend label.
 */
const PREDICTION_CATEGORY_LABEL_TRANSLATIONS: Partial<Record<Locale, Record<string, string>>> = {
    [Locale.zhHans]: {
        Trending: '热门',
        New: '最新',
        Politics: '政治',
        Sports: '体育',
        Crypto: '加密货币',
        Iran: '伊朗',
        Finance: '金融',
        Geopolitics: '地缘政治',
        Tech: '科技',
        Culture: '文化',
        Economy: '经济',
        Weather: '天气',
        Mentions: '提及',
        Elections: '选举',
        Live: '进行中',
        Basketball: '篮球',
        Soccer: '足球',
        Esports: '电子竞技',
        Football: '美式足球',
        Hockey: '冰球',
        Baseball: '棒球',
        Tennis: '网球',
        'World Cup': '世界杯',
        'Premier League': '英超',
        'League of Legend': '英雄联盟',
        LOL: '英雄联盟',
        'La Liga': '西甲',
    },
    [Locale.zhHant]: {
        Trending: '熱門',
        New: '最新',
        Politics: '政治',
        Sports: '體育',
        Crypto: '加密貨幣',
        Iran: '伊朗',
        Finance: '金融',
        Geopolitics: '地緣政治',
        Tech: '科技',
        Culture: '文化',
        Economy: '經濟',
        Weather: '天氣',
        Mentions: '提及',
        Elections: '選舉',
        Live: '進行中',
        Basketball: '籃球',
        Soccer: '足球',
        Esports: '電子競技',
        Football: '美式足球',
        Hockey: '冰球',
        Baseball: '棒球',
        Tennis: '網球',
        'World Cup': '世界盃',
        'Premier League': '英超',
        'League of Legend': '英雄聯盟',
        LOL: '英雄聯盟',
        'La Liga': '西甲',
    },
    [Locale.ja]: {
        Trending: 'トレンド',
        New: '新着',
        Politics: '政治',
        Sports: 'スポーツ',
        Crypto: '暗号資産',
        Iran: 'イラン',
        Finance: '金融',
        Geopolitics: '地政学',
        Tech: 'テック',
        Culture: 'カルチャー',
        Economy: '経済',
        Weather: '天気',
        Mentions: 'メンション',
        Elections: '選挙',
        Live: 'ライブ',
        Basketball: 'バスケットボール',
        Soccer: 'サッカー',
        Esports: 'eスポーツ',
        Football: 'アメフト',
        Hockey: 'ホッケー',
        Baseball: '野球',
        Tennis: 'テニス',
        'World Cup': 'ワールドカップ',
        'Premier League': 'プレミアリーグ',
        'League of Legend': 'リーグ・オブ・レジェンド',
        LOL: 'リーグ・オブ・レジェンド',
        'La Liga': 'ラ・リーガ',
    },
    [Locale.ko]: {
        Trending: '트렌딩',
        New: '최신',
        Politics: '정치',
        Sports: '스포츠',
        Crypto: '암호화폐',
        Iran: '이란',
        Finance: '금융',
        Geopolitics: '지정학',
        Tech: '기술',
        Culture: '문화',
        Economy: '경제',
        Weather: '날씨',
        Mentions: '멘션',
        Elections: '선거',
        Live: '라이브',
        Basketball: '농구',
        Soccer: '축구',
        Esports: 'e스포츠',
        Football: '미식축구',
        Hockey: '하키',
        Baseball: '야구',
        Tennis: '테니스',
        'World Cup': '월드컵',
        'Premier League': '프리미어리그',
        'League of Legend': '리그 오브 레전드',
        LOL: '리그 오브 레전드',
        'La Liga': '라리가',
    },
    [Locale.es]: {
        Trending: 'Tendencias',
        New: 'Nuevos',
        Politics: 'Política',
        Sports: 'Deportes',
        Crypto: 'Cripto',
        Iran: 'Irán',
        Finance: 'Finanzas',
        Geopolitics: 'Geopolítica',
        Tech: 'Tecnología',
        Culture: 'Cultura',
        Economy: 'Economía',
        Weather: 'Clima',
        Mentions: 'Menciones',
        Elections: 'Elecciones',
        Live: 'En vivo',
        Basketball: 'Baloncesto',
        Soccer: 'Fútbol',
        Football: 'Fútbol americano',
        Baseball: 'Béisbol',
        Tennis: 'Tenis',
        'World Cup': 'Copa del Mundo',
    },
};

/**
 * Resolve a backend category label to its frontend translation for the given locale
 * when one exists, otherwise return the original backend label unchanged.
 *
 * Pass `i18n.locale` from `useLingui()` so the result updates on locale change.
 */
export function resolvePredictionCategoryLabel(locale: string, label: string): string {
    return PREDICTION_CATEGORY_LABEL_TRANSLATIONS[locale as Locale]?.[label] ?? label;
}
