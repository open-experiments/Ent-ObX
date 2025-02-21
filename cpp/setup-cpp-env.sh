#!/bin/bash

# Exit on any error
set -e

# Set workspace directory
WORKSPACE="/opt/app-root/src/workspace"
BUILD_DIR="${WORKSPACE}/build"
OTEL_DIR="${WORKSPACE}/opentelemetry-cpp"

# Function to check disk space
check_space() {
    df -h ${WORKSPACE}
}

echo "Initial disk space:"
check_space

echo "Creating build directory structure..."
mkdir -p ${BUILD_DIR}

echo "Installing core build tools..."
dnf -y install gcc gcc-c++ make cmake git openssl-devel \
    automake autoconf libtool which zlib-devel

# Build Protobuf with cleanup
echo "Building Protobuf..."
cd ${WORKSPACE}
rm -rf protobuf  # Clean any previous failed build
git clone --recurse-submodules -b v3.19.4 --depth 1 https://github.com/protocolbuffers/protobuf.git
cd protobuf
./autogen.sh
./configure --prefix=${BUILD_DIR}
make -j2  # Reduced parallel jobs to save memory
make install
cd ${WORKSPACE}
rm -rf protobuf  # Clean up source after build
export PATH="${BUILD_DIR}/bin:${PATH}"
export LD_LIBRARY_PATH="${BUILD_DIR}/lib:${LD_LIBRARY_PATH}"
ldconfig

echo "Space after Protobuf build:"
check_space

# Build gRPC with cleanup
echo "Building gRPC..."
cd ${WORKSPACE}
rm -rf grpc  # Clean any previous failed build
git clone --recurse-submodules -b v1.48.0 --depth 1 https://github.com/grpc/grpc.git
cd grpc
mkdir -p cmake/build
cd cmake/build
cmake -DgRPC_INSTALL=ON \
      -DgRPC_BUILD_TESTS=OFF \
      -DCMAKE_INSTALL_PREFIX=${BUILD_DIR} \
      -DgRPC_SSL_PROVIDER=package \
      ../..
make -j2  # Reduced parallel jobs to save memory
make install
cd ${WORKSPACE}
rm -rf grpc  # Clean up source after build
ldconfig

echo "Space after gRPC build:"
check_space

# Build OpenTelemetry
echo "Building OpenTelemetry C++ SDK..."
cd ${WORKSPACE}
rm -rf opentelemetry-cpp  # Clean any previous failed build
git clone --depth 1 https://github.com/open-telemetry/opentelemetry-cpp.git
cd ${OTEL_DIR}
mkdir -p build && cd build
cmake -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_PREFIX_PATH=${BUILD_DIR} \
      -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
      -DBUILD_TESTING=OFF \
      -DWITH_OTLP=ON \
      -DWITH_OTLP_GRPC=ON \
      -DCMAKE_INSTALL_PREFIX=${BUILD_DIR} \
      ..
make -j2  # Reduced parallel jobs to save memory
make install
cd ${WORKSPACE}
rm -rf opentelemetry-cpp  # Clean up source after build

echo "Final disk space:"
check_space

echo "Setting up environment variables..."
cat > ${WORKSPACE}/env.sh << 'EOF'
export LD_LIBRARY_PATH=${BUILD_DIR}/lib64:${BUILD_DIR}/lib:$LD_LIBRARY_PATH
export CMAKE_PREFIX_PATH=${BUILD_DIR}
export PKG_CONFIG_PATH=${BUILD_DIR}/lib/pkgconfig:${BUILD_DIR}/lib64/pkgconfig:$PKG_CONFIG_PATH
export PATH=${BUILD_DIR}/bin:$PATH
EOF

echo "Setup complete!"
echo "To use the environment, run: source ${WORKSPACE}/env.sh"
