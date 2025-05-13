export declare function isWrappedResponse(response: any): boolean;
export declare function extractData<T>(response: any): T;
export declare function isSuccessful(response: any, legacySuccessProperty?: string): boolean;
export declare function getMessage(response: any, fallbackMessage?: string): string;
export declare function processResponse<T>(response: any, options?: {
    legacySuccessProperty?: string;
    fallbackMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (message: string) => void;
}): {
    data: T;
    success: boolean;
    message: string;
    isWrappedFormat: boolean;
};
