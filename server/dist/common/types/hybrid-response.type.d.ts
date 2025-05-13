export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}
export type HybridResponse<T> = T & {
    success: boolean;
    message?: string;
    data: T;
    [key: string]: any;
};
export declare function isHybridResponse<T extends Record<string, any>>(response: any): response is HybridResponse<T>;
