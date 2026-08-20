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
# Pinned explicitly (not resolved from stable.txt at build time) so a future kubectl/helm
# release can't silently change API/cluster-version support underneath this image with no
# diff to review. Bump deliberately -- check for CVEs against the new version first.
ARG BASE_IMAGE=dhi.io/python:3.12-alpine3.24-dev
ARG TARGETARCH
# kubectl is sourced directly from DHI's distroless kubectl image (switched from the
# sanketikahub/kubectl:2.2.0 rehost -- that image's Debian -dev base carried its own CVEs
# on top of an older Go toolchain). Only the kubectl binary is copied out -- NOT used as a
# base image, so this stage's total distroless-ness (no shell, confirmed via
# `docker run --entrypoint /bin/sh` failing) doesn't matter; the runtime stays on the
# hardened DHI Alpine base below. kubectl-convert is deliberately not copied (unused by
# this service).
# Measured with `trivy rootfs` on the real extracted binaries:
#   sanketikahub/kubectl:2.2.0 (Debian -dev, kubectl v1.32.13-dirty) = 33 findings / 0 CRIT / 19 HIGH
#   dhi.io/kubectl:1.34-debian13 (distroless, kubectl v1.34.10)     =  0 findings
# Needs its own CI registry login (dhi.io, separate from Docker Hub) -- see build_and_deploy.yaml.
ARG KUBECTL_IMAGE=dhi.io/kubectl:1.34-debian13
# helm is sourced the same way as kubectl above -- DHI's distroless helm image, binary copied
# out via a build stage, never used as a base. This is helm v3.x (not v4): `dhi.io/helm:3-debian13`
# ships v3.21.4 built with Go 1.26.6 -- the patched toolchain that clears the Go-stdlib CVEs
# (x/net/idna, html/template, encoding/xml, net/url, crypto/tls) that get.helm.sh's own builds
# (v3.21.4 and v4.2.4 both) still carry, since neither has been recompiled with a fixed Go yet.
# Also picks up a patched oras-go. Measured with `trivy image`:
#   get.helm.sh v4.2.4 / v3.21.4 (curl'd, Go 1.26.5) = 9 findings / 0 CRIT / 9 HIGH
#   dhi.io/helm:3-debian13 (Go 1.26.6)               = 0 findings
# Using v3 here also removes the v3->v4 compatibility question entirely -- this is the same
# major version already verified against this codebase's live v3.17.1-managed releases.
ARG HELM_IMAGE=dhi.io/helm:3-debian13

ARG KUBECTL_IMAGE
FROM ${KUBECTL_IMAGE} AS kubectlsrc
ARG HELM_IMAGE
FROM ${HELM_IMAGE} AS helmsrc

FROM ${BASE_IMAGE} AS build
ARG TARGETARCH

RUN apk add --no-cache \
    build-base \
    gcc \
    musl-dev \
    python3-dev \
    librdkafka-dev \
    libpq-dev

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

COPY --from=kubectlsrc /usr/local/bin/kubectl /usr/local/bin/kubectl
COPY --from=helmsrc /usr/local/bin/helm /usr/local/bin/helm
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
# Bare TCP connect via python's own stdlib (no curl/wget installed in the runtime image, and
# adding one just for this would grow the image for no real benefit) -- default uvicorn port
# per routes.py's own fallback config is 8000.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["python3", "-c", "import socket,sys; s=socket.create_connection(('127.0.0.1',8000),timeout=3); s.close()"]
CMD [ "uvicorn", "routes:app", "--host", "0.0.0.0" ]
