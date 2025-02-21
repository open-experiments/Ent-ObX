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
