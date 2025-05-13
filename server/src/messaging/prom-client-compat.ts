/**
 * Compatibility layer for OpenTelemetry/prom-client without external dependencies
 */

// Simple implementation of the Counter class
class Counter {
  private name: string;
  private help: string;
  private value: number = 0;

  constructor(options: { name: string; help: string }) {
    this.name = options.name;
    this.help = options.help;
  }

  inc(amount: number = 1) {
    this.value += amount;
  }

  get() {
    return this.value;
  }
}

// Simple implementation of the Histogram class
class Histogram {
  private name: string;
  private help: string;
  private buckets: number[];
  private values: number[] = [];

  constructor(options: { name: string; help: string; buckets?: number[] }) {
    this.name = options.name;
    this.help = options.help;
    this.buckets = options.buckets || [0.1, 0.5, 1, 2, 5, 10];
  }

  observe(value: number) {
    this.values.push(value);
  }

  get() {
    return this.values;
  }
}

// Mock Registry class
class Registry {
  metrics: Record<string, any> = {};

  registerMetric(metric: any) {
    this.metrics[metric.name] = metric;
  }
}

// Create internal promClient object without external dependency
const register = new Registry();

function collectDefaultMetrics() {
  console.log('Default metrics collection initialized');
}

function linearBuckets(start: number, width: number, count: number) {
  const buckets = [];
  for (let i = 0; i < count; i++) {
    buckets.push(start + (width * i));
  }
  return buckets;
}

// Exporter compatibility class
export class PrometheusExporter {
  constructor(options: any) {
    // No direct initialization needed, metrics will be exposed by NestJS
    console.log('Prometheus metrics initialized via compatibility layer');
  }
}

// MeterProvider compatibility class
export class MeterProvider {
  private registry: Registry = new Registry();
  
  constructor() {
    // Initialize registry
  }
  
  addMetricReader(exporter: any) {
    // No-op for compatibility
  }
  
  getMeter(name: string) {
    return {
      createCounter: (name: string, options: any) => new Counter({
        name,
        help: options.description || name,
      }),
      createHistogram: (name: string, options: any) => new Histogram({
        name, 
        help: options.description || name,
        buckets: options.boundaries || linearBuckets(0.1, 0.5, 10),
      })
    };
  }
}
