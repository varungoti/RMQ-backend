import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
export interface RefreshJwtPayload {
    sub: string;
    iat?: number;
    exp?: number;
}
declare const RefreshJwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class RefreshJwtStrategy extends RefreshJwtStrategy_base {
    private configService;
    constructor(configService: ConfigService);
    validate(req: Request, payload: RefreshJwtPayload): Promise<RefreshJwtPayload>;
}
export {};
