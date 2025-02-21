# C++ OpenTelemetry Metrics in OpenShift

This guide demonstrates how to set up a C++ application that generates metrics using OpenTelemetry (OTEL) and sends them to Prometheus via the OpenTelemetry Collector in an OpenShift environment.

## Repository Structure
```
cpp/
├── README.md                       # This guide
├── CMakeLists.txt                 # CMake build configuration
├── game_simulator.cpp             # Main C++ application
├── setup-cpp-env.sh              # Environment setup script
└── cpp-deploy.yaml               # OpenShift deployment configuration
```

## Prerequisites

- OpenShift cluster with admin access
- OpenTelemetry Operator installed
- Prometheus Operator installed
- Access to a project/namespace (in this case 'tme-obx')

## Required Files

1. [cpp-deploy.yaml](cpp-deploy.yaml) - OpenShift Pod and PVC configuration
2. [setup-cpp-env.sh](setup-cpp-env.sh) - Development environment setup script
3. [CMakeLists.txt](CMakeLists.txt) - CMake build configuration
4. [game_simulator.cpp](game_simulator.cpp) - Main application source code

## Step 1: Create Development Environment

1. Deploy the development pod and PVC:
```bash
oc apply -f cpp-deploy.yaml
```

The deployment configuration includes:
- 10Gi Persistent Volume Claim
- UBI 8 base image
- Root permissions for package installation
- Workspace mount at `/opt/app-root/src/workspace`

## Step 2: Set Up Development Environment

1. Connect to the pod:
```bash
oc rsh cpp-dev
```

2. Copy setup script to pod:
```bash
oc cp setup-cpp-env.sh cpp-dev:/opt/app-root/src/workspace/
```

3. Run the setup script:
```bash
cd /opt/app-root/src/workspace
chmod +x setup-cpp-env.sh
./setup-cpp-env.sh
```

The script installs and builds:
- Development tools (gcc, cmake, etc.)
- Protobuf v3.19.4
- gRPC v1.48.0
- OpenTelemetry C++ SDK

## Step 3: Build Application

1. Copy source files to pod:
```bash
oc cp CMakeLists.txt cpp-dev:/opt/app-root/src/workspace/
oc cp game_simulator.cpp cpp-dev:/opt/app-root/src/workspace/
```

2. Build the application:
```bash
cd /opt/app-root/src/workspace
mkdir -p build_app && cd build_app
cmake ..
make
```

## Step 4: Run and Monitor

1. Run the application:
```bash
./game_simulator
```

2. Check Prometheus metrics:
- `tme_obx_games_total`
- `tme_obx_guesses_total`
- `tme_obx_guess_distance`

Example PromQL queries:
```promql
# Total games completed
sum(tme_obx_games_total)

# Average guesses per game
rate(tme_obx_guesses_total[5m]) / rate(tme_obx_games_total[5m])

# 95th percentile of guess distance
histogram_quantile(0.95, sum(rate(tme_obx_guess_distance_bucket[5m])) by (le))
```

## Implementation Details

The implementation uses:
- OpenTelemetry C++ SDK for metrics generation
- gRPC for metric export to collector
- CMake for project building
- UBI 8 base image for OpenShift compatibility

For specific implementation details, see:
- [game_simulator.cpp](game_simulator.cpp) for metrics and game logic
- [CMakeLists.txt](CMakeLists.txt) for build configuration
- [setup-cpp-env.sh](setup-cpp-env.sh) for dependency setup

## Troubleshooting

1. If build fails with "No space left on device":
   - Check PVC size with `df -h`
   - Increase PVC size in [cpp-deploy.yaml](cpp-deploy.yaml)

2. If CMake can't find protobuf:
   - Verify protobuf installation in ${BUILD_DIR}
   - Check CMAKE_PREFIX_PATH setting

3. If metrics don't appear in Prometheus:
   - Verify OTEL collector configuration
   - Check collector logs for any errors
   - Verify ServiceMonitor configuration

## Notes

- Application sends metrics to `otel-collector.tme-obx.svc.cluster.local:4317`
- All builds are done in the persistent volume
- Uses the same metric names as the Java implementation for consistency
