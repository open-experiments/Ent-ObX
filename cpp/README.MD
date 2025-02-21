# C++ OpenTelemetry Metrics in OpenShift

This guide demonstrates how to set up a C++ application that generates metrics using OpenTelemetry (OTEL) and sends them to Prometheus via the OpenTelemetry Collector in an OpenShift environment.

## Repository Structure
```
cpp/
├── README.md
├── CMakeLists.txt                  # CMake build configuration
├── game_simulator.cpp              # Main C++ application
├── setup-cpp-env.sh               # Environment setup script
└── cpp-deploy.yaml                # OpenShift deployment configuration
```

## Prerequisites

- OpenShift cluster with admin access
- OpenTelemetry Operator installed
- Prometheus Operator installed
- Access to a project/namespace (in this case 'tme-obx')

## Step 1: Create Development Environment

1. Create the Pod with persistent storage:

```yaml
# cpp-deploy.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: cpp-workspace-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: Pod
metadata:
  name: cpp-dev
spec:
  containers:
    - name: cpp-dev
      image: registry.access.redhat.com/ubi8/ubi
      command: ["sleep", "infinity"]
      securityContext:
        allowPrivilegeEscalation: true
        runAsUser: 0
      volumeMounts:
        - name: workspace
          mountPath: /opt/app-root/src/workspace
  volumes:
    - name: workspace
      persistentVolumeClaim:
        claimName: cpp-workspace-pvc
```

Apply the configuration:
```bash
oc apply -f cpp-deploy.yaml
```

## Step 2: Set Up Development Environment

The setup script installs all necessary dependencies and builds OpenTelemetry C++ SDK:

```bash
# setup-cpp-env.sh
#!/bin/bash

# Exit on any error
set -e

# Set workspace directory
WORKSPACE="/opt/app-root/src/workspace"
BUILD_DIR="${WORKSPACE}/build"

echo "Creating build directory structure..."
mkdir -p ${BUILD_DIR}

echo "Installing core build tools..."
dnf -y install gcc gcc-c++ make cmake git openssl-devel \
    automake autoconf libtool which zlib-devel

# Build Protobuf
echo "Building Protobuf..."
cd ${WORKSPACE}
git clone --recurse-submodules -b v3.19.4 --depth 1 https://github.com/protocolbuffers/protobuf.git
cd protobuf
mkdir cmake_build && cd cmake_build
cmake -Dprotobuf_BUILD_TESTS=OFF \
      -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
      -DCMAKE_INSTALL_PREFIX=${BUILD_DIR} \
      ..
make -j$(nproc)
make install

# Build gRPC
echo "Building gRPC..."
cd ${WORKSPACE}
git clone --recurse-submodules -b v1.48.0 --depth 1 https://github.com/grpc/grpc.git
cd grpc
mkdir -p cmake/build
cd cmake/build
cmake -DgRPC_INSTALL=ON \
      -DgRPC_BUILD_TESTS=OFF \
      -DCMAKE_INSTALL_PREFIX=${BUILD_DIR} \
      -DgRPC_SSL_PROVIDER=package \
      ..
make -j$(nproc)
make install

# Build OpenTelemetry
echo "Building OpenTelemetry C++ SDK..."
cd ${WORKSPACE}
git clone --depth 1 https://github.com/open-telemetry/opentelemetry-cpp.git
cd opentelemetry-cpp
mkdir -p build && cd build
cmake -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_PREFIX_PATH=${BUILD_DIR} \
      -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
      -DBUILD_TESTING=OFF \
      -DWITH_OTLP=ON \
      -DWITH_OTLP_GRPC=ON \
      -DCMAKE_INSTALL_PREFIX=${BUILD_DIR} \
      ..
make -j$(nproc)
make install
```

## Step 3: Create C++ Application

Create CMakeLists.txt:
```cmake
cmake_minimum_required(VERSION 3.12)
project(game_simulator)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_PREFIX_PATH ${CMAKE_PREFIX_PATH} "/opt/app-root/src/workspace/build")

find_package(Protobuf REQUIRED)
find_package(gRPC REQUIRED)
find_package(opentelemetry-cpp REQUIRED)

add_executable(game_simulator game_simulator.cpp)

target_link_libraries(game_simulator PRIVATE
    protobuf::libprotobuf
    gRPC::grpc++
    opentelemetry_metrics
    opentelemetry_exporter_otlp_grpc
    opentelemetry_resources
)
```

The main application (game_simulator.cpp) implements a number guessing game that generates metrics:
- Total games played
- Total guesses made
- Guess distance (how far from target)

## Step 4: Build and Run

1. Connect to the development pod:
```bash
oc rsh cpp-dev
```

2. Run the setup script:
```bash
cd /opt/app-root/src/workspace
./setup-cpp-env.sh
```

3. Build the application:
```bash
mkdir -p build_app && cd build_app
cmake ..
make
```

4. Run the application:
```bash
./game_simulator
```

## Step 5: View Metrics

The metrics will be available in Prometheus under the following names:
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

## Notes

- The application uses OpenTelemetry C++ SDK 1.8.1
- Metrics are sent to the OTEL collector at `otel-collector.tme-obx.svc.cluster.local:4317`
- All builds are done in the persistent volume to maintain state
- The UBI 8 base image is used for Red Hat OpenShift compatibility

## Troubleshooting

1. If build fails with "No space left on device":
   - Check PVC size with `df -h`
   - Increase PVC size in cpp-deploy.yaml

2. If CMake can't find protobuf:
   - Verify protobuf installation in ${BUILD_DIR}
   - Check CMAKE_PREFIX_PATH setting

3. If metrics don't appear in Prometheus:
   - Verify OTEL collector configuration
   - Check collector logs for any errors
   - Verify ServiceMonitor configuration
