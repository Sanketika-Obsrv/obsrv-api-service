# DHI hardened, multi-stage build on ALPINE.
# DHI's python:3.12-alpine3.24 only ships two tiers: "-dev" (full apk + compiler toolchain +
# shell) and the plain tag (fully distroless -- no /bin/sh at all, confirmed via `docker run
# --entrypoint sh` failing with "executable file not found"). The app genuinely needs a shell
# at runtime (flink_command.py uses subprocess.run(shell=True), connector_registry.py uses
# os.system), so the distroless tier is not usable here -- but the compiler toolchain
# (gcc/build-base/musl-dev/python3-dev) is build-only and does NOT need to ship to prod.
# Fix: build stage compiles confluent-kafka/psycopg2 (C extensions) against the -dev headers;
# runtime stage is also "-dev" (only tier with a shell) but installs ONLY the runtime shared
# libs (librdkafka, libpq -- not their -dev/-headers counterparts) and copies compiled Python
# packages + kubectl/helm binaries from the build stage. No compiler, no headers, no apk
# build tools in the shipped image.
ARG BASE_IMAGE=dhi.io/python:3.12-alpine3.24-dev
ARG TARGETARCH
ARG HELM_VERSION=v3.13.2

FROM ${BASE_IMAGE} AS build
ARG TARGETARCH
ARG HELM_VERSION

RUN apk add --no-cache \
    build-base \
    gcc \
    musl-dev \
    python3-dev \
    librdkafka-dev \
    libpq-dev \
    curl \
    tar \
    gzip

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
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---------- runtime ----------
FROM ${BASE_IMAGE} AS runtime

# Runtime-only shared libs (no -dev/headers, no compiler toolchain).
RUN apk add --no-cache \
    librdkafka \
    libpq \
    ca-certificates \
    bash

COPY --from=build /usr/local/bin/kubectl /usr/local/bin/kubectl
COPY --from=build /usr/local/bin/helm /usr/local/bin/helm
# This image's python only looks at /usr/lib/python3.12/site-packages (confirmed via sys.path;
# /usr/local is NOT on it), so packages must land there, not under /usr/local/lib/....
COPY --from=build /install/bin/ /usr/local/bin/
COPY --from=build /install/lib/python3.12/site-packages/ /usr/lib/python3.12/site-packages/

WORKDIR /app
COPY src ./src
COPY helm-charts ./helm-charts
RUN chown -R nonroot:nonroot /app
USER nonroot
WORKDIR /app/src
CMD [ "uvicorn", "routes:app", "--host", "0.0.0.0" ]
