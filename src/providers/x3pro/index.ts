/* cspell:disable */
import { fetchJSON } from '@/helpers/fetchJSON.js';

export const enum X3ProKolListLabel {
    PVP = 1,
    Celebrity = 2,
    Web3 = 3,
    Projector = 4,
    Beauty = 5,
}

export const enum X3ProOrderType {
    Latest = 3,
    Follower = 2,
}

type Response<T> =
    | {
          success: true;
          data: T;
      }
    | {
          success: false;
          error: {
              message: string;
          };
      };

interface List<T> {
    endRow: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    isFirstPage: boolean;
    isLastPage: boolean;
    list: T[];
    navigateFirstPage: number;
    navigateLastPage: number;
    navigatePages: number;
    navigatepageNums: number[];
    nextPage: number;
    pageNum: number;
    pageSize: number;
    pages: number;
    prePage: number;
    size: number;
    startRow: number;
    total: number;
}

export interface Profile {
    avatar: string;
    bk: string;
    ca?: string;
    caCreateTime?: number;
    caPostId?: string;
    createTime: number;
    fanCount: number;
    focusCount: number;
    homeDisplayUrl?: string;
    homeRealUrl?: string;
    id: string;
    includeTime: number;
    introLinks: Array<{
        displayUrl: string;
        realUrl: string;
        shortUrl: string;
    }>;
    introduction: string;
    introductionLang: string;
    isFocus: boolean;
    isMonitor: boolean;
    label: number;
    label2: number;
    monitorCount: number;
    name: string;
    rank: number;
    screenName: string;
    twitterUrl: string;
    verifyType: number;
}

export type KolList = List<Profile>;

function resolveX3ProResponse<T>(res: Response<T>) {
    if (res.success) return res.data;
    throw new Error(res.error.message);
}

class X3Pro {
    async getKolList(
        label: X3ProKolListLabel,
        orderType: X3ProOrderType,
        options?: {
            pageNo?: number;
            pageSize?: number;
        },
    ) {
        const { pageNo = 1, pageSize = 20 } = options || {};
        const res = await fetchJSON<Response<KolList>>('/api/x3pro/scraper/kol/kolPage', {
            method: 'POST',
            body: JSON.stringify({ label, orderType, pageNo, pageSize }),
        });
        return resolveX3ProResponse(res);
    }
}

export const X3ProProvider = new X3Pro();
