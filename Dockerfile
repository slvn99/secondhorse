FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ca-certificates bash build-essential ripgrep jq vim \
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g @openai/codex
WORKDIR /workspace
CMD ["codex"]

