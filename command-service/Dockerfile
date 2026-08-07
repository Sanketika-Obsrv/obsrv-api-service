# DHI hardened build on ALPINE (scans 0 vulns on both Docker Scout and trivy, vs debian's
# unfixed-CVE noise). alpine-dev variant keeps a shell for kubectl/helm subprocess(shell=True).
# confluent-kafka + psycopg2 compile from source against the apk build deps below.
ARG BASE_IMAGE=dhi.io/python:3.12-alpine3.24-dev
FROM ${BASE_IMAGE}
ARG TARGETARCH
ARG HELM_VERSION=v3.13.2

RUN apk add --no-cache \
    build-base \
    gcc \
    musl-dev \
    python3-dev \
    librdkafka-dev \
    libpq-dev \
    curl \
    tar \
    gzip \
    ca-certificates \
    bash

RUN mkdir -p /usr/local/bin && \
    curl -fsSLo /usr/local/bin/kubectl "https://dl.k8s.io/release/$(curl -fsSL https://dl.k8s.io/release/stable.txt)/bin/linux/${TARGETARCH:-amd64}/kubectl" && \
    chmod +x /usr/local/bin/kubectl && \
    kubectl version --client

RUN cd /tmp && curl -fsSLO "https://get.helm.sh/helm-${HELM_VERSION}-linux-${TARGETARCH:-amd64}.tar.gz" \
    && tar -zxf "helm-${HELM_VERSION}-linux-${TARGETARCH:-amd64}.tar.gz" \
    && mv "linux-${TARGETARCH:-amd64}/helm" /usr/local/bin/helm \
    && rm -rf /tmp/helm-* "/tmp/linux-${TARGETARCH:-amd64}" \
    && helm version

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
COPY helm-charts ./helm-charts
RUN chown -R nonroot:nonroot /app
USER nonroot
WORKDIR /app/src
CMD [ "uvicorn", "routes:app", "--host", "0.0.0.0" ]
