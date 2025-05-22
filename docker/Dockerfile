# DockaShell Default Development Environment
# Ubuntu 24.04 LTS with Node.js 22 LTS + Python 3 + Essential Dev Tools

FROM ubuntu:24.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Set up basic environment
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Create a non-root user for development
RUN useradd -m -u 1000 -s /bin/bash developer && \
    usermod -aG sudo developer && \
    echo 'developer ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Install essential packages and development tools
RUN apt-get update && apt-get install -y \
    # Core system utilities
    curl \
    wget \
    ca-certificates \
    gnupg \
    lsb-release \
    # File operations and text processing
    patch \
    diffutils \
    grep \
    sed \
    gawk \
    tree \
    zip \
    unzip \
    jq \
    # Text editors
    nano \
    vim \
    # Development tools
    git \
    build-essential \
    gcc \
    g++ \
    make \
    cmake \
    pkg-config \
    # Python development
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    # Other useful tools
    htop \
    procps \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install ripgrep (modern grep replacement)
RUN curl -LO https://github.com/BurntSushi/ripgrep/releases/download/14.1.1/ripgrep_14.1.1-1_amd64.deb && \
    dpkg -i ripgrep_14.1.1-1_amd64.deb && \
    rm ripgrep_14.1.1-1_amd64.deb

# Install Node.js 22 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Install pnpm globally
RUN npm install -g pnpm

# Set up Python environment
RUN python3 -m pip install --upgrade pip setuptools wheel

# Create workspace directory
RUN mkdir -p /workspace && chown developer:developer /workspace

# Set default working directory
WORKDIR /workspace

# Switch to non-root user
USER developer

# Set up default shell environment
RUN echo 'export PATH="/workspace/node_modules/.bin:$PATH"' >> ~/.bashrc && \
    echo 'alias ll="ls -la"' >> ~/.bashrc && \
    echo 'alias la="ls -la"' >> ~/.bashrc && \
    echo 'alias grep="grep --color=auto"' >> ~/.bashrc

# Default command
CMD ["/bin/bash"]
