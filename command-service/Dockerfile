# command-service shells out to kubectl/helm (subprocess with shell=True), so it
# needs a shell + those CLIs at runtime → use the hardened DHI python -dev variant
# (near-zero-CVE base, retains shell + package manager) rather than a distroless runtime.
FROM dhi.io/python:3.12-debian13-dev
USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    jq \
    gzip \
    && rm -rf /var/lib/apt/lists/*

# kubectl + helm are invoked by the service at runtime
RUN mkdir -p /usr/local/bin && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

RUN curl -fsSL -o /tmp/helm.tar.gz https://get.helm.sh/helm-v3.13.2-linux-amd64.tar.gz && \
    tar -zxf /tmp/helm.tar.gz -C /tmp && \
    mv /tmp/linux-amd64/helm /usr/local/bin/helm && \
    rm -rf /tmp/helm.tar.gz /tmp/linux-amd64

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
COPY helm-charts ./helm-charts
WORKDIR /app/src
CMD [ "uvicorn", "routes:app", "--host", "0.0.0.0" ]
