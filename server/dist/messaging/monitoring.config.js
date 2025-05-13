"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringConfig = void 0;
const common_1 = require("@nestjs/common");
const prom_client_compat_1 = require("./prom-client-compat");
let MonitoringConfig = class MonitoringConfig {
    constructor() {
        const exporter = new prom_client_compat_1.PrometheusExporter({
            port: 9464,
            endpoint: '/metrics',
        });
        this.meterProvider = new prom_client_compat_1.MeterProvider();
        this.meterProvider.addMetricReader(exporter);
        this.meter = this.meterProvider.getMeter('assessment-service');
        this.initializeMetrics();
    }
    initializeMetrics() {
        this.meter.createCounter('assessment_messages_received_total', {
            description: 'Total number of assessment messages received',
        });
        this.meter.createCounter('assessment_messages_processed_total', {
            description: 'Total number of assessment messages processed successfully',
        });
        this.meter.createCounter('assessment_messages_failed_total', {
            description: 'Total number of assessment messages that failed processing',
        });
        this.meter.createCounter('assessment_messages_dead_lettered_total', {
            description: 'Total number of assessment messages sent to dead letter queue',
        });
        this.meter.createHistogram('assessment_message_processing_duration_seconds', {
            description: 'Time taken to process assessment messages',
            boundaries: [0.1, 0.5, 1, 2, 5],
        });
        this.meter.createCounter('assessment_validation_errors_total', {
            description: 'Total number of validation errors',
        });
        this.meter.createCounter('assessment_business_errors_total', {
            description: 'Total number of business logic errors',
        });
        this.meter.createCounter('assessment_transient_errors_total', {
            description: 'Total number of transient errors',
        });
    }
};
exports.MonitoringConfig = MonitoringConfig;
MonitoringConfig.ALERT_RULES = `
    # High message processing failure rate
    ALERT HighMessageFailureRate
    IF rate(assessment_messages_failed_total[5m]) / rate(assessment_messages_received_total[5m]) > 0.1
    FOR 5m
    LABELS { severity = "critical" }
    ANNOTATIONS {
      summary = "High message processing failure rate",
      description = "Message processing failure rate is above 10% for the last 5 minutes"
    }

    # High dead letter queue rate
    ALERT HighDeadLetterRate
    IF rate(assessment_messages_dead_lettered_total[5m]) / rate(assessment_messages_received_total[5m]) > 0.05
    FOR 5m
    LABELS { severity = "warning" }
    ANNOTATIONS {
      summary = "High dead letter queue rate",
      description = "Dead letter queue rate is above 5% for the last 5 minutes"
    }

    # Slow message processing
    ALERT SlowMessageProcessing
    IF histogram_quantile(0.95, rate(assessment_message_processing_duration_seconds_bucket[5m])) > 2
    FOR 5m
    LABELS { severity = "warning" }
    ANNOTATIONS {
      summary = "Slow message processing",
      description = "95th percentile of message processing time is above 2 seconds"
    }
  `;
MonitoringConfig.DASHBOARD_QUERIES = {
    messageProcessingRate: `
      sum(rate(assessment_messages_processed_total[5m]))
    `,
    failureRate: `
      sum(rate(assessment_messages_failed_total[5m])) / sum(rate(assessment_messages_received_total[5m]))
    `,
    deadLetterRate: `
      sum(rate(assessment_messages_dead_lettered_total[5m])) / sum(rate(assessment_messages_received_total[5m]))
    `,
    processingTime: `
      histogram_quantile(0.95, sum(rate(assessment_message_processing_duration_seconds_bucket[5m])) by (le))
    `,
    errorDistribution: `
      sum(rate(assessment_validation_errors_total[5m])) by (type),
      sum(rate(assessment_business_errors_total[5m])) by (type),
      sum(rate(assessment_transient_errors_total[5m])) by (type)
    `,
};
exports.MonitoringConfig = MonitoringConfig = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MonitoringConfig);
//# sourceMappingURL=monitoring.config.js.map