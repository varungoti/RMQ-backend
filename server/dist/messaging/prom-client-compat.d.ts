declare class Counter {
    private name;
    private help;
    private value;
    constructor(options: {
        name: string;
        help: string;
    });
    inc(amount?: number): void;
    get(): number;
}
declare class Histogram {
    private name;
    private help;
    private buckets;
    private values;
    constructor(options: {
        name: string;
        help: string;
        buckets?: number[];
    });
    observe(value: number): void;
    get(): number[];
}
export declare class PrometheusExporter {
    constructor(options: any);
}
export declare class MeterProvider {
    private registry;
    constructor();
    addMetricReader(exporter: any): void;
    getMeter(name: string): {
        createCounter: (name: string, options: any) => Counter;
        createHistogram: (name: string, options: any) => Histogram;
    };
}
export {};
