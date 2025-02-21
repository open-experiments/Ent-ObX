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
