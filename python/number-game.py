import time
import socket
import sys
import random
import threading
import logging
from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Add callback for metric export success/failure
def export_callback(success: bool, data=None):
    if success:
        logger.info(f"[METRICS EXPORT SUCCESS] Timestamp: {time.time()}")
    else:
        logger.error(f"[METRICS EXPORT FAILED] Timestamp: {time.time()}")
        if data:
            logger.error(f"[EXPORT ERROR] {data}")

def test_collector_connection():
    endpoint = "otel-collector-collector.tme-aix02.svc.cluster.local"
    port = 4317
    try:
        with socket.create_connection((endpoint, port), timeout=5) as sock:
            logger.info(f"Successfully connected to {endpoint}:{port}")
            return True
    except Exception as e:
        logger.error(f"Failed to connect to {endpoint}:{port}: {e}")
        return False

# Initialize metrics with enhanced debugging
try:
    # Test connection first
    if not test_collector_connection():
        logger.error("Cannot connect to collector - exiting")
        sys.exit(1)

    # Create resource with enhanced context
    resource = Resource.create({
        "service.name": "tme_obx",
        "service.namespace": "tme-aix02",
        "app.kubernetes.io/component": "opentelemetry-collector", 
        "app.kubernetes.io/instance": "tme-aix02.otel-collector",
        "app.kubernetes.io/name": "otel-collector-collector",
        "app.kubernetes.io/part-of": "opentelemetry",
        "operator.opentelemetry.io/collector-service-type": "base"
    })

    # Initialize metric exporter with debug settings
    metric_exporter = OTLPMetricExporter(
        endpoint="otel-collector-collector.tme-aix02.svc.cluster.local:4317",
        insecure=True,
        timeout=10  # 10 second timeout
    )
    
    # Add callback for debugging
    metric_exporter.on_success = lambda data: export_callback(True, data)
    metric_exporter.on_error = lambda data: export_callback(False, data)

    # Configure metric reader with more detailed settings
    reader = PeriodicExportingMetricReader(
        metric_exporter,
        export_interval_millis=1000,
        export_timeout_millis=10000
    )

    # Set up meter provider
    # Always create a new MeterProvider since we need our reader
    meter_provider = MeterProvider(
        resource=resource,
        metric_readers=[reader]
    )
    metrics.set_meter_provider(meter_provider)
    logger.info("MeterProvider initialized successfully")

except Exception as e:
    logger.error(f"Error in metrics setup: {e}", exc_info=True)
    raise

# Get meter with a simpler name
meter = metrics.get_meter("game_simulator")

# Create metrics with debug logging - using get_or_create to avoid duplicates
try:
    # Dictionary to store all our metrics
    metrics_config = {
        'games_counter': {
            'name': "games_total",
            'description': "Total number of games played",
            'unit': "1",
            'type': 'counter'
        },
        'guess_counter': {
            'name': "guesses_total",
            'description': "Total number of guesses made",
            'unit': "1",
            'type': 'counter'
        },
        'guess_distance': {
            'name': "guess_distance",
            'description': "Distance of guess from actual number",
            'unit': "1",
            'type': 'histogram'
        },
        'game_duration': {
            'name': "game_duration",
            'description': "Time taken to complete a game",
            'unit': "s",
            'type': 'histogram'
        },
        'active_players': {
            'name': "active_players",
            'description': "Number of players currently in game",
            'unit': "1",
            'type': 'histogram'
        }
    }

    # Create all metrics
    for metric_key, config in metrics_config.items():
        if config['type'] == 'counter':
            globals()[metric_key] = meter.create_counter(
                name=config['name'],
                description=config['description'],
                unit=config['unit']
            )
        elif config['type'] == 'histogram':
            globals()[metric_key] = meter.create_histogram(
                name=config['name'],
                description=config['description'],
                unit=config['unit']
            )
    
    logger.info("Game metrics created successfully")
except Exception as e:
    logger.error(f"Error creating game metrics: {e}", exc_info=True)
    raise

def record_with_debug(metric, value, attributes=None):
    """Helper function to record metrics with enhanced debug output"""
    try:
        # Check metric type without creating test counter
        metric_type = type(metric).__name__
        # Add common attributes
        metric_attrs = {
            'service.name': 'tme_obx',
            'service.namespace': 'tme-aix02',
            **(attributes or {})
        }

        if metric_type == '_Counter':
            metric.add(value, metric_attrs)
        else:  # Histogram type
            metric.record(value, metric_attrs)
        logger.debug(f"[METRIC RECORDED] Type={metric_type}: value={value} attributes={metric_attrs}")
    except Exception as e:
        logger.error(f"[METRIC RECORD ERROR] Type={type(metric).__name__}: {e}", exc_info=True)

def test_metric_generation():
    """Test function to verify metric generation and export"""
    try:
        # Create an initial set of test metrics
        metrics_to_test = {
            'games_counter': 1,
            'guess_counter': 5,
            'guess_distance': 3.0,
            'game_duration': 2.5,
            'active_players': 2
        }
        
        # Record each metric
        test_id = str(int(time.time()))
        for metric_name, value in metrics_to_test.items():
            metric = globals()[metric_name]
            test_attributes = {
                "test": "true",
                "game_id": test_id,
                "batch": "test-metrics"
            }
            record_with_debug(metric, value, test_attributes)
            logger.info(f"Test metric recorded: {metric_name}={value}")
            # Small delay between metrics to avoid batching
            time.sleep(0.1)
        
        # Wait for export
        logger.info("Waiting for metric export...")
        time.sleep(5)  # Longer wait to ensure export
        
        # Check collector endpoint
        logger.info("Verifying metrics in collector...")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            collector_host = "otel-collector-collector.tme-aix02.svc.cluster.local"
            collector_port = 8889
            result = sock.connect_ex((collector_host, collector_port))
            if result == 0:
                logger.info(f"Successfully connected to collector at {collector_host}:{collector_port}")
            else:
                logger.warning(f"Could not connect to collector at {collector_host}:{collector_port}")
        finally:
            sock.close()
            
    except Exception as e:
        logger.error(f"Failed to generate test metrics: {e}", exc_info=True)

def simulate_game():
    """Simulates one game play with enhanced error handling"""
    try:
        target = random.randint(1, 20)
        attempts = 0
        start_time = time.time()
        game_id = str(int(time.time()))
        logger.info(f"[GAME START] ID: {game_id}, Target: {target}")
        
        current_guess = random.randint(1, 20)
        while current_guess != target:
            attempts += 1
            distance = abs(current_guess - target)
            
            # Record metrics with debug
            guess_attributes = {"game_id": game_id}
            record_with_debug(guess_counter, 1, guess_attributes)
            record_with_debug(guess_distance, distance, guess_attributes)
            logger.debug(f"[GUESS] Game: {game_id}, Value: {current_guess}, Distance: {distance}")
            
            if current_guess < target:
                current_guess += max(1, random.randint(1, distance))
            else:
                current_guess -= max(1, random.randint(1, distance))
            
            time.sleep(random.uniform(2.0, 5.0))
        
        # Game completed
        duration = time.time() - start_time
        record_with_debug(game_duration, duration)
        record_with_debug(games_counter, 1, {
            "result": "win",
            "attempts": str(attempts),
            "game_id": game_id
        })
        logger.info(f"[GAME WON] ID: {game_id}, Attempts: {attempts}, Duration: {duration:.2f}s")
    
    except Exception as e:
        logger.error(f"Error in game simulation: {e}", exc_info=True)

def simulate_concurrent_games():
    """Simulates multiple concurrent games with enhanced error handling"""
    game_count = 0
    try:
        while True:
            game_count += 1
            num_players = random.randint(1, 5)
            record_with_debug(active_players, num_players)
            logger.info(f"[BATCH {game_count}] Starting {num_players} concurrent games")
            
            threads = []
            for _ in range(num_players):
                thread = threading.Thread(target=simulate_game)
                thread.start()
                threads.append(thread)
            
            for thread in threads:
                thread.join()
            
            logger.info(f"[BATCH {game_count}] Completed {num_players} games")
            time.sleep(random.uniform(1, 3))
    
    except Exception as e:
        logger.error(f"Error in concurrent game simulation: {e}", exc_info=True)

if __name__ == "__main__":
    try:
        from opentelemetry import version
        logger.info(f"OpenTelemetry Version: {version.__version__}")
        logger.info("Starting Game Metrics Simulator...")
        logger.info("Generating metrics:")
        logger.info("- games_total")
        logger.info("- guesses_total")
        logger.info("- guess_distance")
        logger.info("- game_duration")
        logger.info("- active_players")
        
        # Run test metric first
        test_metric_generation()
        
        # Start simulation
        simulate_concurrent_games()
    except KeyboardInterrupt:
        logger.info("\nStopping simulator...")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Simulator failed: {e}", exc_info=True)
        sys.exit(1)
