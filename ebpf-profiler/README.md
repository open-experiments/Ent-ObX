## 🧠 Open5GS Observability Stack with eBPF + OpenTelemetry

This repo provides OpenShift-compatible manifests for lightweight observability of 5G CNFs using [eBPF profiling](https://github.com/open-telemetry/opentelemetry-ebpf-profiler) and OpenTelemetry Collector.

---

### 📦 Build & Deployment Overview

We built the custom `ebpf-profiler` binary from the upstream [`open-telemetry/opentelemetry-ebpf-profiler`](https://github.com/open-telemetry/opentelemetry-ebpf-profiler) source using a Fedora 24 VM running on **OpenShift Virtualization (OCP Virt)**:

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
