FROM ubuntu:latest AS ubuntu
RUN apt-get update && apt-get install -y curl

RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
RUN chmod +x ./kubectl
RUN mv ./kubectl /usr/local/bin

FROM --platform=linux/amd64 python:3.10-alpine
COPY --from=ubuntu /usr/local/bin /usr/local/bin
WORKDIR /app
COPY  . .
RUN pip install --no-cache-dir -r requirements.txt
# COPY src ./src
# WORKDIR /app/src
# CMD [ "uvicorn", "routes:app", "--host", "0.0.0.0" ]

RUN ls
RUN pwd


