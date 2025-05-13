export declare class ResponseWrapper<T> {
    success: boolean;
    data: T;
    message?: string;
    static success<T>(data: T, message?: string): ResponseWrapper<T>;
    static error<T>(message: string): ResponseWrapper<T>;
}
