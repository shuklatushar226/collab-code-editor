FROM alpine:3.19
RUN apk add --no-cache g++ dumb-init libstdc++
WORKDIR /workspace
USER nobody
ENTRYPOINT ["dumb-init", "--"]
