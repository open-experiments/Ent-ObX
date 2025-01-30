## Python Application Metrics -> OTel -> Prometheus

**Objective:** AI app developers can leverage opentelemetry with k8s as **aggregated middle-layer** to ship/sink their data to, from otel as **common data framework** -> data can be exported to where-ever data consumers can get it from as final persistant place.

<div align="center">
    <img src="https://raw.githubusercontent.com/tme-osx/Telco-ObX/refs/heads/main/python/images/arch.png" width="800"/>
</div>

### Files:

[1] prereq.txt , describes initial setup examples for OTEL Collector and Prometheus Service Monitor <br>
[2] requirements.txt , these are the sw packages needs to be installed for sample app to run. Ie pip install -r requirements.txt <br>
[3] number-game.py , auto-play number guessing game that generates metrics and shipped to otel-collector <br>

### IDE RHOAI-Workbench Notebook View:

![](https://raw.githubusercontent.com/tme-osx/Telco-ObX/refs/heads/main/python/images/notebook.png)

### Prometheus View:

![Prometheus Pulled Data](https://raw.githubusercontent.com/tme-osx/Telco-ObX/refs/heads/main/python/images/prometheus_pulled_metrics.png)
![Sample Graph](https://raw.githubusercontent.com/tme-osx/Telco-ObX/refs/heads/main/python/images/figure2.png)




