FROM eclipse-temurin:21-jdk-alpine
RUN apk add --no-cache dumb-init
WORKDIR /workspace
USER nobody
ENTRYPOINT ["dumb-init", "--"]
