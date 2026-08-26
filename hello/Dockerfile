# syntax=docker/dockerfile:1
#
# C++ build/test environment.
#
# Nothing from the project is COPYed in -- build.sh and run.sh bind-mount the
# hello/ directory onto /work at container start, so edits on the host are
# visible immediately and no image rebuild is needed to pick up source changes.
# (Same arrangement as ../rust, for the same reason.)

ARG GCC_VERSION=14
FROM gcc:${GCC_VERSION}-bookworm

# cmake/ninja -> the build itself (ctest comes with cmake)
# file        -> build.sh uses it to report what each artifact actually is
RUN apt-get update && apt-get install -y --no-install-recommends \
        cmake \
        ninja-build \
        file \
    && rm -rf /var/lib/apt/lists/*

# Ninja everywhere, so the container's build is the same shape as the runners'.
ENV CMAKE_GENERATOR=Ninja

# The container runs as the *host* user (see build.sh) and so cannot write to
# root's home. Point HOME at the bind mount, which is writable.
ENV HOME=/work/.docker-cache/home

WORKDIR /work
CMD ["bash"]
