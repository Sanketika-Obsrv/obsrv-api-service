# Build stage — toolchain, deps (into a relocatable venv), and static CLIs.
FROM dhi.io/python:3.13-debian13-dev AS build
USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl gzip && rm -rf /var/lib/apt/lists/*

# Install Python deps into a venv we can copy whole into the distroless runtime.
RUN python -m venv --copies /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# kubectl + helm are static Go binaries the service invokes (shell-free subprocess).
RUN mkdir -p /out/bin && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -m 0755 kubectl /out/bin/kubectl && \
    curl -fsSL -o /tmp/helm.tgz https://get.helm.sh/helm-v3.21.2-linux-amd64.tar.gz && \
    tar -zxf /tmp/helm.tgz -C /tmp && \
    install -m 0755 /tmp/linux-amd64/helm /out/bin/helm

# Runtime stage — DHI distroless python (no shell/pkg manager, non-root by default).
FROM dhi.io/python:3.13-debian13
COPY --from=build /opt/venv /opt/venv
COPY --from=build /out/bin/kubectl /out/bin/helm /usr/local/bin/
# venv on PATH; HOME=/tmp keeps helm/kubectl caches writable for the non-root user.
ENV PATH="/opt/venv/bin:$PATH" HOME=/tmp
WORKDIR /app
COPY src ./src
COPY helm-charts ./helm-charts
WORKDIR /app/src
CMD ["uvicorn", "routes:app", "--host", "0.0.0.0"]
