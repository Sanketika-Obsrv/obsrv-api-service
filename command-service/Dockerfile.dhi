# DHI hardened build on ALPINE (scans 0 vulns on both Docker Scout and trivy, vs debian's
# unfixed-CVE noise). alpine-dev variant keeps a shell for kubectl/helm subprocess(shell=True).
# confluent-kafka + psycopg2 compile from source against the apk build deps below.
ARG BASE_IMAGE=dhi.io/python:3.12-alpine3.24-dev
FROM ${BASE_IMAGE}
ARG TARGETARCH

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
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/${TARGETARCH}/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

RUN curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
COPY helm-charts ./helm-charts
RUN chown -R nonroot:nonroot /app
USER nonroot
WORKDIR /app/src
CMD [ "uvicorn", "routes:app", "--host", "0.0.0.0" ]
