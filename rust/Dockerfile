# syntax=docker/dockerfile:1
#
# Cross-compiling Rust build/run environment.
#
# Nothing from the project is COPYed in -- build.sh and run.sh bind-mount the
# rust/ directory onto /work at container start, so edits on the host are
# visible immediately and no image rebuild is needed to pick up source changes.

ARG RUST_VERSION=1
FROM rust:${RUST_VERSION}-bookworm

ARG ZIG_VERSION=0.14.1

# mingw-w64  -> linker for x86_64-pc-windows-gnu
# musl-tools -> native musl bits
# file/jq    -> used by build.sh to identify artifacts and read cargo metadata
RUN apt-get update && apt-get install -y --no-install-recommends \
        mingw-w64 \
        musl-tools \
        xz-utils \
        curl \
        ca-certificates \
        file \
        jq \
    && rm -rf /var/lib/apt/lists/*

# Zig doubles as a cross-linker: it ships libc stubs for glibc, musl and macOS,
# which is what lets a Linux container emit Mach-O binaries without an Xcode SDK.
RUN set -eux; \
    case "$(dpkg --print-architecture)" in \
        amd64) zig_arch=x86_64 ;; \
        arm64) zig_arch=aarch64 ;; \
        *) echo "unsupported build architecture: $(dpkg --print-architecture)" >&2; exit 1 ;; \
    esac; \
    curl -fsSL -o /tmp/zig.tar.xz \
        "https://ziglang.org/download/${ZIG_VERSION}/zig-${zig_arch}-linux-${ZIG_VERSION}.tar.xz"; \
    mkdir -p /opt/zig; \
    tar -xJf /tmp/zig.tar.xz -C /opt/zig --strip-components=1; \
    rm /tmp/zig.tar.xz; \
    ln -s /opt/zig/zig /usr/local/bin/zig; \
    zig version

# cargo-zigbuild drives zig as the linker for the musl and darwin targets.
RUN cargo install --locked cargo-zigbuild \
    && rm -rf "${CARGO_HOME}/registry" "${CARGO_HOME}/git"

RUN rustup target add \
        x86_64-unknown-linux-musl \
        aarch64-unknown-linux-musl \
        x86_64-apple-darwin \
        aarch64-apple-darwin \
        x86_64-pc-windows-gnu

# Per-target linker settings live in the environment rather than a config.toml so
# they survive CARGO_HOME being relocated into the bind mount below.
ENV CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc \
    MACOSX_DEPLOYMENT_TARGET=11.0 \
    CARGO_TERM_COLOR=always

# The container runs as the *host* user (see build.sh), which cannot write to the
# image's /usr/local/cargo. Point the writable state at the bind mount instead --
# that also means the download cache persists on the host between runs.
# The toolchains themselves stay in RUSTUP_HOME=/usr/local/rustup (read-only).
ENV CARGO_HOME=/work/.docker-cache/cargo \
    HOME=/work/.docker-cache/home

WORKDIR /work
CMD ["bash"]
