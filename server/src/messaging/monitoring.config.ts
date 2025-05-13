import { Injectable } from '@nestjs/common';
import { PrometheusExporter, MeterProvider } from './prom-client-compat';

@Injectable()
export class MonitoringConfig {
  private readonly meterProvider: MeterProvider;
  private readonly meter: any;

  constructor() {
    // Initialize Prometheus exporter
    const exporter = new PrometheusExporter({
      port: 9464, // Default Prometheus port
      endpoint: '/metrics',
    });

    // Initialize meter provider and add PrometheusExporter as metricReader
    this.meterProvider = new MeterProvider();
    this.meterProvider.addMetricReader(exporter);
    this.meter = this.meterProvider.getMeter('assessment-service');

    // Initialize metrics
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // Message processing metrics
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

    // Processing time metrics
    this.meter.createHistogram('assessment_message_processing_duration_seconds', {
      description: 'Time taken to process assessment messages',
      boundaries: [0.1, 0.5, 1, 2, 5], // in seconds
    });

    // Error metrics
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

  // Recommended Prometheus alert rules
  static readonly ALERT_RULES = `
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

  // Recommended Grafana dashboard queries
  static readonly DASHBOARD_QUERIES = {
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
} 