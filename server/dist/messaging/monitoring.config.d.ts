export declare class MonitoringConfig {
    private readonly meterProvider;
    private readonly meter;
    constructor();
    private initializeMetrics;
    static readonly ALERT_RULES = "\n    # High message processing failure rate\n    ALERT HighMessageFailureRate\n    IF rate(assessment_messages_failed_total[5m]) / rate(assessment_messages_received_total[5m]) > 0.1\n    FOR 5m\n    LABELS { severity = \"critical\" }\n    ANNOTATIONS {\n      summary = \"High message processing failure rate\",\n      description = \"Message processing failure rate is above 10% for the last 5 minutes\"\n    }\n\n    # High dead letter queue rate\n    ALERT HighDeadLetterRate\n    IF rate(assessment_messages_dead_lettered_total[5m]) / rate(assessment_messages_received_total[5m]) > 0.05\n    FOR 5m\n    LABELS { severity = \"warning\" }\n    ANNOTATIONS {\n      summary = \"High dead letter queue rate\",\n      description = \"Dead letter queue rate is above 5% for the last 5 minutes\"\n    }\n\n    # Slow message processing\n    ALERT SlowMessageProcessing\n    IF histogram_quantile(0.95, rate(assessment_message_processing_duration_seconds_bucket[5m])) > 2\n    FOR 5m\n    LABELS { severity = \"warning\" }\n    ANNOTATIONS {\n      summary = \"Slow message processing\",\n      description = \"95th percentile of message processing time is above 2 seconds\"\n    }\n  ";
    static readonly DASHBOARD_QUERIES: {
        messageProcessingRate: string;
        failureRate: string;
        deadLetterRate: string;
        processingTime: string;
        errorDistribution: string;
    };
}
