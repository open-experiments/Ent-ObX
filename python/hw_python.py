from flask import Flask, request
import time
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource

app = Flask(__name__)

# Initialize TracerProvider if not already set
if not trace.get_tracer_provider():
    trace_provider = TracerProvider()
    otlp_trace_exporter = OTLPSpanExporter(
        endpoint="otel-collector.tme-aix02.svc:4317",
        insecure=True
    )
    trace_provider.add_span_processor(BatchSpanProcessor(otlp_trace_exporter))
    trace.set_tracer_provider(trace_provider)

# Instrument Flask to capture traces
FlaskInstrumentor().instrument_app(app)
tracer = trace.get_tracer(__name__)

# Initialize MeterProvider if not already set
if not metrics.get_meter_provider():
    resource = Resource.create({"service.name": "fenar-app"})
    metric_exporter = OTLPMetricExporter(
        endpoint="otel-collector.tme-aix02.svc:4317",
        insecure=True
    )
    meter_provider = MeterProvider(resource=resource)
    metrics.set_meter_provider(meter_provider)

meter = metrics.get_meter(__name__)

# Define metrics with fenar.xxx key names
try:
    request_latency = meter.create_histogram(
        "fenar_http_request_latency",
        description="HTTP Request latency"
    )
    request_bytes = meter.create_histogram(
        "fenar_http_request_size_bytes",
        description="Size of HTTP request"
    )
    response_bytes = meter.create_histogram(
        "fenar_http_response_size_bytes",
        description="Size of HTTP response"
    )
except ValueError:
    pass  # Instruments already exist, proceed without error

@app.before_request
def start_timer():
    request.start_time = time.time()

@app.after_request
def log_request(response):
    latency = time.time() - request.start_time

    # Record metrics
    request_latency.record(
        latency,
        attributes={
            "fenar.method": request.method,
            "fenar.endpoint": request.path,
        }
    )
    request_bytes.record(
        request.content_length or 0,
        attributes={
            "fenar.method": request.method,
            "fenar.endpoint": request.path,
        }
    )
    response_bytes.record(
        len(response.data),
        attributes={
            "fenar.method": request.method,
            "fenar.endpoint": request.path,
        }
    )

    return response

@app.route("/")
def hello():
    # Start a span for the "/" route
    with tracer.start_as_current_span("fenar.http_request") as span:
        span.set_attribute("fenar.method", "GET")
        span.set_attribute("fenar.endpoint", "/")
        span.set_attribute("fenar.description", "Root endpoint")
        return "Hello from TME-Obx with OpenTelemetry!"

@app.route("/process")
def process():
    # Start a span for the "/process" route
    with tracer.start_as_current_span("fenar.process_request") as span:
        span.set_attribute("fenar.method", "GET")
        span.set_attribute("fenar.endpoint", "/process")
        span.set_attribute("fenar.description", "Processing endpoint")

        # Simulate some processing
        time.sleep(0.5)
        result = {"status": "success"}
        span.set_attribute("fenar.result", str(result))
        return result

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=35010)
