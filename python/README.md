## Custom user/application metrics generated within RHOAI Python App.

Objective: AI app developers can leverage opentelemetry with k8s as aggregated middle-layer to ship/sink their data to, from otel as common ground -> data can be exported to where-ever data consumers can get it from as final persistant place.

## Files 

[1] prereq.txt , describes initial setup examples for OTEL Collector and Prometheus Service Monitor <br>
[2] requirements.txt , these are the sw packages needs to be installed for sample app to run. Ie pip install -r requirements.txt <br>
[3] number-game.py , auto-play number guessing game that generates metrics and shipped to otel-collector <br>

## Prometheus Pulled Data from OTel via Prometheus Exporter

![Prometheus Pulled Data](https://raw.githubusercontent.com/tme-osx/Telco-ObX/refs/heads/main/python/images/prometheus_pulled_metrics.png)




