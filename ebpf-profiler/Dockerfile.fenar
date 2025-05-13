# Author: Fatih E. NAR
# Dockerfile
FROM registry.access.redhat.com/ubi8/ubi-minimal

# Metadata
LABEL name="opentelemetry-ebpf-profiler" \
      maintainer="Fatih E. Nar" \
      summary="OpenTelemetry eBPF Profiler binary on UBI8 minimal" \
      version="latest"

# Set working directory
WORKDIR /app

# Copy statically built binary
COPY ebpf-profiler /app/ebpf-profiler

# Expose the relevant port if needed (edit as necessary)
EXPOSE 4317

# Set non-root user (optional hardening)
RUN microdnf install -y shadow-utils && \
    useradd --no-create-home --shell /sbin/nologin ebpfuser && \
    chown ebpfuser /app/ebpf-profiler

USER ebpfuser

# Command to run
ENTRYPOINT ["/app/ebpf-profiler"]
