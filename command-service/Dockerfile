FROM --platform=linux/amd64 python:3.10-alpine
COPY --from=ubuntu /usr/local/bin /usr/local/bin
RUN apk update && apk add curl jq && curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && mv kubectl /usr/local/bin/
RUN apk add libcrypto3=3.1.4-r5
RUN apk upgrade
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
WORKDIR /app/src
CMD [ "uvicorn", "routes:app", "--host", "0.0.0.0" ]