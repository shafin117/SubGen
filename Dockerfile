FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    build-essential \
    cmake \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install whisper.cpp with optimized compilation
RUN git clone https://github.com/ggerganov/whisper.cpp.git /tmp/whisper && \
    cd /tmp/whisper && \
    make -j$(nproc) 2>&1 | tail -n 20 && \
    mkdir -p /opt/whisper && \
    cp build/bin/main /opt/whisper/ && \
    wget -q https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin -O /opt/whisper/ggml-base.en.bin && \
    rm -rf /tmp/whisper

# Set environment variables
ENV WHISPER_BIN=/opt/whisper/main
ENV WHISPER_MODEL=/opt/whisper/ggml-base.en.bin
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]
