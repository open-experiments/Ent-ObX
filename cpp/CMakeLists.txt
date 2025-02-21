cmake_minimum_required(VERSION 3.12)
project(game_simulator)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(opentelemetry-cpp REQUIRED)

add_executable(game_simulator src/game_simulator.cpp)

target_link_libraries(game_simulator PRIVATE
    opentelemetry_metrics
    opentelemetry_exporter_otlp_grpc
    opentelemetry_resources
)
