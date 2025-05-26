# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/devcontainers/python:3.12

###############################################################################
# 1. Root section – add the missing bits
###############################################################################
USER root
ARG DEBIAN_FRONTEND=noninteractive

# - Node 20 LTS (via NodeSource)
# - ripgrep, jq, git-lfs, build chain
# - Corepack activation (gives you yarn + pnpm without npm -g)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg jq git-lfs build-essential ripgrep \
    \
    # ----- Node 20 LTS ----------------------------------------------------------
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash -      \
    && apt-get install -y --no-install-recommends nodejs             \
    \
    # ----- Enable Corepack shims for yarn / pnpm -------------------------------
    && corepack enable                                               \
    && corepack prepare yarn@stable --activate                       \
    && corepack prepare pnpm@latest --activate                       \
    \
    # ----- Python helpers ------------------------------------------------------
    && python -m pip install --no-cache-dir --upgrade pip wheel      \
    \
    # ----- Cleanup -------------------------------------------------------------
    && apt-get autoremove -y && apt-get clean && rm -rf /var/lib/apt/lists/*

# Add apply_patch script
COPY docker/apply_patch.py /usr/local/bin/apply_patch.py
RUN chmod +x /usr/local/bin/apply_patch.py

###############################################################################
# 2. Back to the non-root dev user that ships with devcontainers (UID 1000)
###############################################################################
USER vscode
WORKDIR /workspace

CMD ["bash"]
