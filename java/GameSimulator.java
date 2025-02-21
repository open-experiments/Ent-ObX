package com.example.game;

import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.metrics.LongCounter;
import io.opentelemetry.api.metrics.DoubleHistogram;
import io.opentelemetry.api.metrics.Meter;
import io.opentelemetry.exporter.otlp.metrics.OtlpGrpcMetricExporter;
import io.opentelemetry.sdk.metrics.SdkMeterProvider;
import io.opentelemetry.sdk.metrics.export.PeriodicMetricReader;
import io.opentelemetry.sdk.resources.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Random;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class GameSimulator {
    private static final Logger logger = LoggerFactory.getLogger(GameSimulator.class);
    private static final Random random = new Random();
    
    private final LongCounter gamesCounter;
    private final LongCounter guessCounter;
    private final DoubleHistogram guessDistance;
    private final AtomicInteger currentPlayers = new AtomicInteger(0);

    public GameSimulator() {
        Resource resource = Resource.getDefault()
            .toBuilder()
            .put("service.name", "game_simulator")
            .build();

        OtlpGrpcMetricExporter metricExporter = OtlpGrpcMetricExporter.builder()
            .setEndpoint("http://otel-collector.tme-obx.svc.cluster.local:4317")
            .build();

        SdkMeterProvider meterProvider = SdkMeterProvider.builder()
            .setResource(resource)
            .registerMetricReader(PeriodicMetricReader.builder(metricExporter)
                .setInterval(1, TimeUnit.SECONDS)
                .build())
            .build();

        Meter meter = meterProvider.get("game_simulator");

        gamesCounter = meter.counterBuilder("games_total")
            .setDescription("Total number of games played")
            .build();

        guessCounter = meter.counterBuilder("guesses_total")
            .setDescription("Total number of guesses made")
            .build();

        guessDistance = meter.histogramBuilder("guess_distance")
            .setDescription("Distance between guess and target number")
            .build();
    }

    private void simulateGame() {
        String gameId = String.valueOf(System.currentTimeMillis());
        int target = random.nextInt(20) + 1;
        int attempts = 0;
        int currentGuess;

        logger.info("Starting new game with ID: {}", gameId);

        do {
            attempts++;
            currentGuess = random.nextInt(20) + 1;
            int distance = Math.abs(currentGuess - target);

            guessCounter.add(1, Attributes.builder()
                .put("game_id", gameId)
                .build());
                
            guessDistance.record(distance, Attributes.builder()
                .put("game_id", gameId)
                .build());

            try {
                Thread.sleep(random.nextInt(1000) + 500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        } while (currentGuess != target);

        gamesCounter.add(1, Attributes.builder()
            .put("game_id", gameId)
            .put("attempts", attempts)
            .build());

        logger.info("Game {} completed in {} attempts", gameId, attempts);
    }

    public void startSimulation() {
        ExecutorService executor = Executors.newFixedThreadPool(5);
        
        while (true) {
            try {
                int numPlayers = random.nextInt(5) + 1;
                currentPlayers.set(numPlayers);
                
                logger.info("Starting batch with {} players", numPlayers);
                
                for (int i = 0; i < numPlayers; i++) {
                    executor.submit(this::simulateGame);
                }

                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        executor.shutdown();
    }

    public static void main(String[] args) {
        GameSimulator simulator = new GameSimulator();
        simulator.startSimulation();
    }
}
