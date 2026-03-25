FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    g++ \
    nodejs \
    npm \
    bash \
    coreutils \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY runner.sh /runner.sh
RUN chmod +x /runner.sh

ENTRYPOINT ["/runner.sh"]