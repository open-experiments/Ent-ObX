from flask import Flask, request, render_template_string, session
import time
import socket
import sys
import random
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.trace.status import Status, StatusCode

# ... [Previous HTML template code remains the same] ...

# Initialize Flask app
app = Flask(__name__)
app.secret_key = 'your-secret-key'

# Create resource with enhanced context
resource = Resource.create({
    "app": "tme-aix-wb02",
    "service.name": "number-game",
    "service.version": "1.0.0",
    "deployment.environment": "production",
    "host.name": socket.gethostname(),
    "namespace": "tme_obx"
})

# Initialize TracerProvider
if not trace.get_tracer_provider():
    try:
        otlp_trace_exporter = OTLPSpanExporter(
            endpoint="otel-collector-collector.tme-aix02.svc.cluster.local:4317",
            insecure=True
        )
        trace_provider = TracerProvider(resource=resource)
        trace_provider.add_span_processor(BatchSpanProcessor(otlp_trace_exporter))
        trace.set_tracer_provider(trace_provider)
        print("Successfully initialized TracerProvider")
    except Exception as e:
        print(f"Error initializing TracerProvider: {e}")
        raise

# Initialize MeterProvider with debug export handler
def debug_export_handler(err):
    if err:
        print(f"[METRIC EXPORT ERROR] {err}")
    else:
        print("[METRIC EXPORT] Metrics successfully exported")

if not metrics.get_meter_provider():
    try:
        metric_exporter = OTLPMetricExporter(
            endpoint="otel-collector-collector.tme-aix02.svc.cluster.local:4317",
            insecure=True
        )
        reader = PeriodicExportingMetricReader(
            metric_exporter,
            export_interval_millis=1000,
            export_timeout_millis=5000,
            export_failure_handler=debug_export_handler
        )
        meter_provider = MeterProvider(
            resource=resource,
            metric_readers=[reader]
        )
        metrics.set_meter_provider(meter_provider)
        print("MeterProvider initialized with debug handler")
    except Exception as e:
        print(f"Error in metrics setup: {e}")
        raise

# Instrument Flask
FlaskInstrumentor().instrument_app(app)
tracer = trace.get_tracer("tme_obx_game")
meter = metrics.get_meter("tme_obx_game")

# Create metrics
try:
    games_counter = meter.create_counter(
        "tme_obx_games_total",
        description="Total number of games played",
        unit="1"
    )
    guess_counter = meter.create_counter(
        "tme_obx_guesses_total",
        description="Total number of guesses made",
        unit="1"
    )
    guess_distance = meter.create_histogram(
        "tme_obx_guess_distance",
        description="Distance of guess from actual number",
        unit="1"
    )
    game_duration = meter.create_histogram(
        "tme_obx_game_duration",
        description="Time taken to complete a game",
        unit="s"
    )
    print("Game metrics created successfully")
except Exception as e:
    print(f"Error creating game metrics: {e}")
    raise

def log_metric(name, value, attributes=None):
    """Helper function to log metric recording"""
    print(f"[METRIC RECORDED] {name}: {value} {attributes if attributes else ''}")

@app.route('/', methods=['GET', 'POST'])
def game():
    message = None
    message_type = None
    
    # Start new game if needed
    if 'target_number' not in session:
        session['target_number'] = random.randint(1, 20)
        session['attempts'] = 0
        session['start_time'] = time.time()
        session['games_played'] = session.get('games_played', 0)
        print(f"[NEW GAME] Target number: {session['target_number']}")
    
    if request.method == 'POST':
        with tracer.start_as_current_span("process_guess") as span:
            try:
                guess = int(request.form['guess'])
                target = session['target_number']
                
                # Record guess attempt
                session['attempts'] += 1
                attributes = {"game_id": str(session['games_played'])}
                guess_counter.add(1, attributes)
                log_metric("tme_obx_guesses_total", 1, attributes)
                
                # Record distance from target
                distance = abs(guess - target)
                guess_distance.record(distance, attributes)
                log_metric("tme_obx_guess_distance", distance, attributes)
                
                span.set_attribute("guess", guess)
                span.set_attribute("distance", distance)
                print(f"[GUESS] Player guessed: {guess}, Distance from target: {distance}")
                
                if guess == target:
                    # Game won
                    duration = time.time() - session['start_time']
                    game_duration.record(duration)
                    win_attributes = {
                        "result": "win",
                        "attempts": str(session['attempts'])
                    }
                    games_counter.add(1, win_attributes)
                    log_metric("tme_obx_game_duration", duration)
                    log_metric("tme_obx_games_total", 1, win_attributes)
                    
                    message = f"Congratulations! You guessed it in {session['attempts']} attempts!"
                    message_type = "success"
                    print(f"[GAME WON] Attempts: {session['attempts']}, Duration: {duration:.2f}s")
                    
                    # Reset for new game
                    session['games_played'] += 1
                    session.pop('target_number')
                    
                else:
                    # Provide hint
                    hint = "higher" if guess < target else "lower"
                    message = f"Try a {hint} number!"
                    message_type = "hint"
                    
            except ValueError as e:
                span.set_status(Status(StatusCode.ERROR))
                span.record_exception(e)
                message = "Please enter a valid number between 1 and 20."
                message_type = "error"
                print(f"[ERROR] {e}")
    
    return render_template_string(
        GAME_TEMPLATE,
        message=message,
        message_type=message_type
    )

if __name__ == "__main__":
    try:
        print("Starting Number Guessing Game with OpenTelemetry...")
        print("Metrics being exported:")
        print("- tme_obx_games_total")
        print("- tme_obx_guesses_total")
        print("- tme_obx_guess_distance")
        print("- tme_obx_game_duration")
        app.run(debug=False, host="0.0.0.0", port=35010)
    except Exception as e:
        print(f"Failed to start application: {e}")
        sys.exit(1)
