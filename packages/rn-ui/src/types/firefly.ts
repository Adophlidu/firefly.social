export interface FireflyResponse<T> {
    code: number;
    data?: T;
    error?: string[];
}
