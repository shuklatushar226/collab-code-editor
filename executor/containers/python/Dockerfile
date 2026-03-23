FROM python:3.12-alpine
RUN apk add --no-cache dumb-init
# Install common scientific packages
RUN pip install --no-cache-dir numpy 2>/dev/null || true
WORKDIR /workspace
USER nobody
ENTRYPOINT ["dumb-init", "--"]
