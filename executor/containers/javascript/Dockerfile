FROM node:20-alpine
RUN apk add --no-cache dumb-init
RUN adduser -D -u 1001 runner
WORKDIR /workspace
# Install TypeScript globally for TS execution
RUN npm install -g typescript ts-node @types/node --quiet
USER nobody
ENTRYPOINT ["dumb-init", "--"]
