# OpenTelemetry Java App Metrics in OpenShift

This guide demonstrates how to enrich up a java application that generates metrics using OpenTelemetry (OTEL) and sends them to Prometheus via the OpenTelemetry Collector in an OpenShift environment.

## Repository Structure
```
.
├── README.md
├── collector-config.yaml     # OpenTelemetry Collector configuration
├── service-monitor.yaml      # Prometheus ServiceMonitor configuration 
├── prometheus-rb.yaml        # Prometheus RBAC configuration
├── java-deploy.yaml         # Java development pod configuration
├── pom.xml                  # Maven project configuration
└── GameSimulator.java       # Main Java application
```

## Prerequisites

- OpenShift cluster 
- OpenTelemetry & Prometheus Operator installed and instances deployed in tenant namespace (here tme-obx)
- Access to a project/namespace (in this case 'tme-obx')

## Step 1: Create OpenTelemetry Collector

Apply the OpenTelemetry Collector configuration:
```bash
oc apply -f collector-config.yaml
```

See [collector-config.yaml](collector-config.yaml) for the complete configuration.

## Step 2: Create ServiceMonitor and RBAC

1. Apply the ServiceMonitor configuration:
```bash
oc apply -f service-monitor.yaml
```

2. Set up Prometheus RBAC:
```bash
oc apply -f prometheus-rb.yaml
```

See [service-monitor.yaml](service-monitor.yaml) and [prometheus-rb.yaml](prometheus-rb.yaml) for complete configurations.

## Step 3: Create Java Development Environment

Apply the Java pod configuration:
```bash
oc apply -f java-deploy.yaml
```

See [java-deploy.yaml](java-deploy.yaml) for the complete configuration.

Once the pod is running, access it:
```bash
oc rsh java-dev
```

## Step 4: Set Up Java Project

1. Create project structure:
```bash
mkdir -p otel-game/src/main/java/com/example/game
cd otel-game
```

2. Copy the provided [pom.xml](pom.xml) to your project directory.

## Step 5: Create Java Application

1. Create the GameSimulator class:
```bash
mkdir -p src/main/java/com/example/game/
```

2. Copy the provided [GameSimulator.java](GameSimulator.java) into the created directory.

## Step 6: Build and Run

```bash
cd /opt/app-root/src/workspace/otel-game
mvn clean package
java -jar target/otel-game-1.0-SNAPSHOT.jar
```
![](https://raw.githubusercontent.com/open-experiments/ObX/refs/heads/main/java/images/java.png)<br>


## Step 7: Verify Metrics

1. Check OTELfor receiving the data
![](https://raw.githubusercontent.com/open-experiments/ObX/refs/heads/main/java/images/otel.png)


2. Query metrics in Prometheus:

```bash
label_replace(
  (sum(rate(tme_obx_games_total{attempts="1"}[5m])) / sum(rate(tme_obx_games_total[5m])) * 100) or vector(0),
  "metric", "success_rate_pct", "", ""
)
or
label_replace(
  (rate(tme_obx_guess_distance_sum[5m]) / rate(tme_obx_guess_distance_count[5m])),
  "metric", "avg_distance", "", ""
)
or
label_replace(
  rate(tme_obx_games_total[5m]) * 60,
  "metric", "games_per_minute", "", ""
)
```

![](https://raw.githubusercontent.com/open-experiments/ObX/refs/heads/main/java/images/promo.png)<br>

## Configuration Details

### OpenTelemetry Collector
The collector configuration in [collector-config.yaml](collector-config.yaml) sets up:
- OTLP receivers on ports 4317 (gRPC) and 4318 (HTTP)
- Prometheus exporter on port 8889
- Batch processor for efficient metric handling
- Memory limiter for resource management

### ServiceMonitor
The [service-monitor.yaml](service-monitor.yaml) configures Prometheus to:
- Scrape metrics every 30 seconds
- Target the collector's prometheus port
- Match specific OpenTelemetry service labels

### Java Application
The [GameSimulator.java](GameSimulator.java) implements:
- OTEL metric generation
- Game simulation logic
- Concurrent player handling
- Metric attribute management

## Troubleshooting

1. Verify ServiceMonitor is correctly configured:
```bash
oc get servicemonitor otel-collector-monitor -n tme-obx -o yaml
```

2. Check Prometheus targets:
```
Navigate to: Status -> Targets in your Prometheus UI
```
![](https://raw.githubusercontent.com/open-experiments/ObX/refs/heads/main/java/images/target.png)<br>

## Notes

- The metrics will have the prefix `tme_obx_` as configured in the collector
- All metrics will have the label `source="otel"`
- The OTEL collector is accessible at `otel-collector.tme-obx.svc.cluster.local:4317`
- Prometheus scrapes metrics from port 8889

## Files
- [collector-config.yaml](collector-config.yaml): OpenTelemetry Collector configuration
- [service-monitor.yaml](service-monitor.yaml): Prometheus ServiceMonitor configuration
- [prometheus-rb.yaml](prometheus-rb.yaml): Prometheus RBAC rules
- [java-deploy.yaml](java-deploy.yaml): Java development pod configuration
- [pom.xml](pom.xml): Maven project configuration
- [GameSimulator.java](GameSimulator.java): Main Java application code
