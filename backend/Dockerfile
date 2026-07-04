# Backend Dockerfile for CodeForge
# Installs Node.js + the compilers/interpreters the judge engine shells out to
# (g++ for C++, javac/java for Java, python3 for Python) so SANDBOX_MODE=ulimit
# submissions compile and run correctly on Render.

FROM node:20-slim

# Install judge toolchains + curl (for healthcheck)
RUN apt-get update && apt-get install -y \
    g++ \
    default-jdk \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the source
COPY . .

# Directories the judge/logging code expects to exist
RUN mkdir -p logs temp

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/api/v1/health || exit 1

CMD ["node", "server.js"]