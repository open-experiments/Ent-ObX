#include <opentelemetry/sdk/metrics/meter.h>
#include <opentelemetry/sdk/metrics/meter_provider.h>
#include <opentelemetry/exporters/otlp/otlp_grpc_metric_exporter.h>
#include <opentelemetry/sdk/metrics/periodic_exporting_metric_reader.h>
#include <opentelemetry/sdk/resource/resource.h>

#include <chrono>
#include <random>
#include <thread>
#include <iostream>

using namespace opentelemetry::sdk::metrics;
using namespace opentelemetry::sdk::resource;
namespace metrics_api = opentelemetry::metrics;

int main() {
    // Configure exporter
    opentelemetry::exporter::otlp::OtlpGrpcMetricExporterOptions opts;
    opts.endpoint = "http://otel-collector.tme-obx.svc.cluster.local:4317";
    auto exporter = std::unique_ptr<opentelemetry::sdk::metrics::PushMetricExporter>(
        new opentelemetry::exporter::otlp::OtlpGrpcMetricExporter(opts));

    // Create MeterProvider with resource attributes
    Resource resource = Resource::Create({
        {"service.name", "game_simulator"},
        {"service.namespace", "tme-obx"}
    });

    auto provider = std::make_shared<MeterProvider>(
        MeterProviderOptions().SetResource(resource).SetMetricReader(
            std::make_unique<PeriodicExportingMetricReader>(
                std::move(exporter),
                PeriodicExportingMetricReaderOptions{std::chrono::seconds(1)}
            )
        )
    );

    auto meter = provider->GetMeter("game_simulator", "1.0.0");

    // Create metrics
    auto games_counter = meter->CreateCounter<int64_t>("games_total", 
        "Total number of games played", "1");
    auto guess_counter = meter->CreateCounter<int64_t>("guesses_total",
        "Total number of guesses made", "1");
    auto guess_distance = meter->CreateHistogram<double>("guess_distance",
        "Distance between guess and target number", "1");

    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dist(1, 20);
    std::uniform_int_distribution<> sleep_dist(500, 1500);

    while (true) {
        auto game_id = std::to_string(
            std::chrono::system_clock::now().time_since_epoch().count()
        );
        int target = dist(gen);
        int attempts = 0;
        
        std::cout << "Starting new game with target: " << target << std::endl;

        while (true) {
            attempts++;
            int current_guess = dist(gen);
            double distance = std::abs(current_guess - target);

            opentelemetry::common::KeyValueIterable game_attributes{
                {{"game_id", game_id}}
            };
            guess_counter->Add(1, game_attributes);
            guess_distance->Record(distance, game_attributes);

            if (current_guess == target) {
                opentelemetry::common::KeyValueIterable win_attributes{
                    {{"game_id", game_id}, {"attempts", std::to_string(attempts)}}
                };
                games_counter->Add(1, win_attributes);
                break;
            }

            std::this_thread::sleep_for(
                std::chrono::milliseconds(sleep_dist(gen))
            );
        }

        std::cout << "Game " << game_id << " completed in " 
                  << attempts << " attempts" << std::endl;

        std::this_thread::sleep_for(std::chrono::seconds(2));
    }

    return 0;
}
