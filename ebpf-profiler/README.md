## 🧠 Open5GS Observability Stack with eBPF + OpenTelemetry

This repo provides OpenShift-compatible manifests for lightweight observability of 5G CNFs using [eBPF profiling](https://github.com/open-telemetry/opentelemetry-ebpf-profiler) and OpenTelemetry Collector.

Our 5g Ready2Roll Stack Here: -> https://github.com/open-experiments/sandbox-5g

---

### 📦 Build & Deployment Overview

We built the custom `ebpf-profiler` binary from the upstream [`open-telemetry/opentelemetry-ebpf-profiler`](https://github.com/open-telemetry/opentelemetry-ebpf-profiler) source using a Fedora 24 VM running on **OpenShift Virtualization (OCP Virt)**:

<div align="center">
    <img src="https://raw.githubusercontent.com/open-experiments/Ent-ObX/refs/heads/main/ebpf-profiler/builder.png" width="1200"/>
</div>

```bash
# Build and push steps from fedora-moccasin-eel-24
docker build -f Dockerfile.fenar -t efatnar/opentelemetry-ebpf-profiler:latest .
docker push efatnar/opentelemetry-ebpf-profiler:latest
```

The resulting container is now available at:

```txt
docker.io/efatnar/opentelemetry-ebpf-profiler:latest
```

This image is used by the `DaemonSet` to instrument each node in the OpenShift cluster.

---

### 📁 Files in This Repo

| File              | Description                                                               |
| ----------------- | ------------------------------------------------------------------------- |
| `deployment.yaml` | Deploys the `ebpf-profiler` as a `DaemonSet` with necessary host mounts   |
| `otel.yaml`       | Deploys `otelcol` using the OpenTelemetry Operator with OTLP + debug flow |
| `scc.yaml`        | Adds SCC for privileged eBPF workloads under `open5gs-monitoring` NS      |

---

### 🚀 Quickstart

```bash
oc apply -f scc.yaml
oc apply -f otel.yaml
oc apply -f deployment.yaml
```

---

### Disclaimer

(1) Red Hat build of OpenTelemetry has not support performance profiling data sink (pprof) yet, therefore you may (?) consider using pyroscope for better observability profiling. 

```
Error: failed to get config: cannot unmarshal the configuration: 1 error(s) decoding:
* error decoding 'receivers': unknown type: "pprof" for id: "pprof" (valid values: [snmp awsxray azureeventhub datadog flinkmetrics pulsar solace syslog redis signalfx apachespark cloudfoundry httpcheck snowflake couchdb filelog hostmetrics riak windowsperfcounters docker_stats iis opencensus receiver_creator sshcheck k8sobjects namedpipe statsd awscloudwatch awscontainerinsightreceiver azureblob journald kafkametrics nginx prometheus_simple vcenter filestats jaeger mongodb oracledb purefb webhookevent zookeeper cloudflare podman_stats prometheus skywalking memcached postgresql purefa splunk_hec sqlquery windowseventlog sapm azuremonitor chrony googlecloudspanner influxdb mongodbatlas nsxt rabbitmq tcplog nop otlp aerospike awsfirehose jmx wavefront collectd loki zipkin active_directory_ds awsecscontainermetrics expvar bigip fluentforward k8s_events kafka kubeletstats sqlserver udplog otlpjsonfile apache carbon elasticsearch googlecloudpubsub haproxy k8s_cluster mysql])
2025/05/13 22:16:25 collector server run finished with error: failed to get config: cannot unmarshal the configuration: 1 error(s) decoding:
```

(2) Object Store is needed to go with Tempo for Traces! We will put some efforts with MinIO standardization with OCP in coming days.
