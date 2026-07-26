# ---- Stage 1: Rebuild Go binaries with Go 1.25.7 to fix crypto/tls CVE ----
FROM --platform=linux/amd64 public.ecr.aws/docker/library/golang:1.25.7-bookworm AS go-builder

# Rebuild kubectl v1.35.1 from source with patched Go toolchain
WORKDIR /build/kubernetes
RUN git clone --depth 1 --branch v1.35.1 https://github.com/kubernetes/kubernetes.git . && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/kubectl ./cmd/kubectl

# Rebuild helm v3.20.0 from source with patched Go toolchain
WORKDIR /build/helm
RUN git clone --depth 1 --branch v3.20.0 https://github.com/helm/helm.git . && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/helm ./cmd/helm

# ---- Stage 2: Final application image ----
FROM --platform=linux/amd64 public.ecr.aws/docker/library/python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    librdkafka-dev \
    curl \
    jq \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Fix MEDIUM: upgrade pip to >= 25.3 (CVE fix)
RUN pip install --no-cache-dir --upgrade "pip>=25.3"

# Copy Go binaries rebuilt with Go 1.25.7 (all Go stdlib & module CVEs fixed)
COPY --from=go-builder /out/kubectl /usr/local/bin/kubectl
COPY --from=go-builder /out/helm /usr/local/bin/helm
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
COPY helm-charts ./helm-charts
WORKDIR /app/src
CMD [ "uvicorn", "routes:app", "--host", "0.0.0.0" ]