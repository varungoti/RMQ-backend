import { ResponseWrapper } from '../wrappers/response.wrapper';
export declare function extractResponseData<T>(response: T | ResponseWrapper<T>): T;
export declare function isResponseSuccessful<T>(response: T | ResponseWrapper<T>, successProp?: string): boolean;
export declare function getResponseMessage<T>(response: T | ResponseWrapper<T>, fallbackMessage?: string): string;
export interface HybridResponseProps {
    success: boolean;
    message?: string;
    data?: any;
    [key: string]: any;
}
export declare function isHybridResponse(obj: unknown): obj is Record<string, unknown> & HybridResponseProps;
export declare function createHybridResponse<T>(data: T | null, messageOrSuccess?: string | boolean, successOrProps?: boolean | Record<string, any>): any;
