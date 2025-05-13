"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterProvider = exports.PrometheusExporter = void 0;
class Counter {
    constructor(options) {
        this.value = 0;
        this.name = options.name;
        this.help = options.help;
    }
    inc(amount = 1) {
        this.value += amount;
    }
    get() {
        return this.value;
    }
}
class Histogram {
    constructor(options) {
        this.values = [];
        this.name = options.name;
        this.help = options.help;
        this.buckets = options.buckets || [0.1, 0.5, 1, 2, 5, 10];
    }
    observe(value) {
        this.values.push(value);
    }
    get() {
        return this.values;
    }
}
class Registry {
    constructor() {
        this.metrics = {};
    }
    registerMetric(metric) {
        this.metrics[metric.name] = metric;
    }
}
const promClient = {
    Counter,
    Histogram,
    Registry,
    register: new Registry(),
    linearBuckets: (start, width, count) => {
        const buckets = [];
        for (let i = 0; i < count; i++) {
            buckets.push(start + (width * i));
        }
        return buckets;
    },
    collectDefaultMetrics: () => {
        console.log('Default metrics collection initialized');
    }
};
class PrometheusExporter {
    constructor(options) {
        console.log('Prometheus metrics initialized via compatibility layer');
    }
}
exports.PrometheusExporter = PrometheusExporter;
class MeterProvider {
    constructor() {
        this.registry = new Registry();
    }
    addMetricReader(exporter) {
    }
    getMeter(name) {
        return {
            createCounter: (name, options) => new Counter({
                name,
                help: options.description || name,
            }),
            createHistogram: (name, options) => new Histogram({
                name,
                help: options.description || name,
                buckets: options.boundaries || promClient.linearBuckets(0.1, 0.5, 10),
            })
        };
    }
}
exports.MeterProvider = MeterProvider;
//# sourceMappingURL=prom-client-compat.js.map