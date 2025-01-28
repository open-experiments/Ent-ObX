from flask import Flask, request
import time
import socket
import sys
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

# Initialize Flask app
app = Flask(__name__)

# Create resource with enhanced context
resource = Resource.create({
    "app": "tme-aix-wb02",
    "service.name": "fenar-app",
    "service.version": "1.0.0",
    "deployment.environment": "production",
    "host.name": socket.gethostname()
})

# Initialize TracerProvider if not already set
if not trace.get_tracer_provider():
    try:
        # Configure trace exporter
        otlp_trace_exporter = OTLPSpanExporter(
            endpoint="otel-collector-collector.tme-aix02.svc.cluster.local:4317",
            insecure=True
        )
        
        # Create trace provider with resource
        trace_provider = TracerProvider(resource=resource)
        trace_provider.add_span_processor(BatchSpanProcessor(otlp_trace_exporter))
        trace.set_tracer_provider(trace_provider)
        print("Successfully initialized TracerProvider")
    except Exception as e:
        print(f"Error initializing TracerProvider: {e}")
        raise

# Instrument Flask to capture traces
FlaskInstrumentor().instrument_app(app)
tracer = trace.get_tracer(__name__)

# Initialize MeterProvider if not already set
if not metrics.get_meter_provider():
    try:
        # Configure metric exporter
        metric_exporter = OTLPMetricExporter(
            endpoint="otel-collector-collector.tme-aix02.svc.cluster.local:4317",
            insecure=True
        )
        
        # Simpler reader configuration
        reader = PeriodicExportingMetricReader(
            metric_exporter,
            export_interval_millis=5000  # Export every 5 seconds
        )
        
        # Create meter provider with resource
        meter_provider = MeterProvider(
            resource=resource,
            metric_readers=[reader]
        )
        metrics.set_meter_provider(meter_provider)
        print("MeterProvider initialized")
    except Exception as e:
        print(f"Error in metrics setup: {e}")
        raise

# Get meter
meter = metrics.get_meter(__name__)

# Define just one metric first for testing
try:
    request_counter = meter.create_counter(
        "fenar_http_requests_total",
        description="Total number of HTTP requests"
    )
    print("Counter metric created successfully")
except Exception as e:
    print(f"Error creating counter metric: {e}")
    raise

@app.before_request
def start_timer():
    request.start_time = time.time()

@app.after_request
def log_request(response):
    try:
        # Just increment the counter
        request_counter.add(1, attributes={"endpoint": request.path})
        print(f"Recorded request to {request.path}")
        return response
    except Exception as e:
        print(f"Error recording metric: {e}")
        return response

@app.route("/")
def hello():
    with tracer.start_as_current_span("fenar.http_request") as span:
        span.set_attribute("fenar.method", "GET")
        span.set_attribute("fenar.endpoint", "/")
        span.set_attribute("fenar.description", "Root endpoint")
        return "Hello from TME-Obx with OpenTelemetry!"

@app.route("/process")
def process():
    with tracer.start_as_current_span("fenar.process_request") as span:
        try:
            span.set_attribute("fenar.method", "GET")
            span.set_attribute("fenar.endpoint", "/process")
            span.set_attribute("fenar.description", "Processing endpoint")
            
            # Add processing status tracking
            with tracer.start_as_current_span("processing.task") as task_span:
                task_span.set_attribute("task.type", "simulation")
                time.sleep(0.5)
                task_span.set_attribute("task.status", "completed")
            
            result = {"status": "success"}
            span.set_attribute("fenar.result", str(result))
            return result
            
        except Exception as e:
            span.set_status(Status(StatusCode.ERROR))
            span.record_exception(e)
            raise

@app.route("/health")
def health():
    with tracer.start_as_current_span("fenar.health_check") as span:
        span.set_attribute("fenar.method", "GET")
        span.set_attribute("fenar.endpoint", "/health")
        return {"status": "healthy"}

if __name__ == "__main__":
    try:
        print("Starting Fenar App with OpenTelemetry...")
        app.run(debug=False, host="0.0.0.0", port=35010)
    except Exception as e:
        print(f"Failed to start application: {e}")
        sys.exit(1)
